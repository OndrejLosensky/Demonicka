import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  // ForbiddenException,
  // Query,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserStatsService } from './user-stats.service';
import { RoleGuard } from '../auth/guards/role.guard';
import { BypassAuth } from '../auth/decorators/bypass-auth.decorator';
import { FileUploadService } from './services/file-upload.service';

/**
 * Users controller handling user profile management.
 * All routes are prefixed with '/users', protected by JWT authentication, and support API versioning.
 */
@Controller('users')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userStatsService: UserStatsService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @BypassAuth()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('participant')
  @BypassAuth()
  @Public()
  createParticipant(@Body() createParticipantDto: CreateParticipantDto) {
    return this.usersService.createParticipant(createParticipantDto);
  }

  @Get()
  @BypassAuth()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  @BypassAuth()
  @Roles(UserRole.ADMIN, UserRole.USER)
  getProfile(@GetUser() user: User) {
    return this.usersService.findOne(user.id);
  }

  @Get('deleted')
  findDeleted() {
    return this.usersService.findDeleted();
  }

  @Post('cleanup')
  cleanup() {
    return this.usersService.cleanup();
  }

  @Get('token/:token/username')
  @Public()
  getUsernameFromToken(@Param('token') token: string) {
    return this.usersService.getUsernameFromToken(token);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }

  @Get(':id/stats')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  async getUserStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.userStatsService.getUserStats(id);
  }

  @Patch('me')
  @Roles(UserRole.ADMIN, UserRole.USER)
  updateProfile(@GetUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Post(':id/register-token')
  @BypassAuth()
  @Roles(UserRole.ADMIN)
  async generateRegisterToken(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.generateRegisterToken(id);
  }

  @Post('profile-picture')
  @BypassAuth()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads/profile-pictures',
        filename: (req, file, cb) => {
          const fileExt = file.originalname.split('.').pop();
          const uniqueId = require('uuid').v4();
          const uniqueName = `${uniqueId}.${fileExt}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Update user's profile picture field
    await this.usersService.update(user.id, { profilePicture: file.filename });
    
    return {
      message: 'Profile picture uploaded successfully',
      filename: file.filename,
      url: `/api/users/profile-pictures/${file.filename}`,
    };
  }

  @Delete('profile-picture')
  @BypassAuth()
  @Roles(UserRole.ADMIN, UserRole.USER)
  async removeProfilePicture(@GetUser() user: User) {
    await this.usersService.update(user.id, { profilePicture: null });
    return { message: 'Profile picture removed successfully' };
  }

  @Get('profile-pictures/:filename')
  @Public()
  async getProfilePicture(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', 'profile-pictures', filename);
    res.sendFile(filePath);
  }
}
