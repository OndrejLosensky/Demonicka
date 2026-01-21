import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  // ForbiddenException,
  Query,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserStatsService } from './user-stats.service';
import { RoleGuard } from '../auth/guards/role.guard';
import { ProfilePictureService } from './profile-picture.service';
import { LoggingService } from '../logging/logging.service';
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
    private readonly profilePictureService: ProfilePictureService,
    private readonly loggingService: LoggingService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  create(@Body() createUserDto: CreateUserDto, @CurrentUser() user?: User) {
    return this.usersService.create(createUserDto, user?.id);
  }

  @Post('participant')
  @Public()
  createParticipant(
    @Body() createParticipantDto: CreateParticipantDto,
    @CurrentUser() user?: User,
  ) {
    return this.usersService.createParticipant(createParticipantDto, user?.id);
  }

  @Get()
  async findAll(
    @Query('withDeleted', new DefaultValuePipe(false), ParseBoolPipe)
    withDeleted: boolean,
  ) {
    return this.usersService.findAll(withDeleted);
  }

  @Get('profile')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.USER)
  getProfile(@GetUser() user: User) {
    return this.usersService.findOne(user.id);
  }

  @Get('me')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.USER)
  getMe(@GetUser() user: User) {
    return this.usersService.findOne(user.id);
  }

  @Get('deleted')
  findDeleted() {
    return this.usersService.findDeleted();
  }

  @Post('cleanup')
  cleanup(@CurrentUser() user?: User) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.loggingService.logSystemOperationTriggered('USERS_CLEANUP', user?.id);
    return this.usersService.cleanup();
  }

  @Get('token/:token/username')
  @Public()
  getUsernameFromToken(@Param('token') token: string) {
    return this.usersService.getUsernameFromToken(token);
  }

  @Get('by-username/:username')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.USER)
  async getByUsername(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user || user.deletedAt) {
      throw new NotFoundException('Uživatel nebyl nalezen');
    }
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      profilePictureUrl: user.profilePictureUrl,
    };
  }

  // 'me' routes must come before ':id' routes to avoid route conflicts
  @Patch('me')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.USER)
  updateProfile(@GetUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Get('me/settings')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.USER)
  async getMySettings(@GetUser() user: User) {
    const me = (await this.usersService.findOne(user.id)) as User & {
      preferredTheme?: string | null;
    };
    return { preferredTheme: me.preferredTheme ?? null };
  }

  @Patch('me/settings')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.USER)
  async updateMySettings(
    @GetUser() user: User,
    @Body() dto: UpdateUserSettingsDto,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const updated = (await this.usersService.updateSettings(
      user.id,
      dto,
    )) as User & {
      preferredTheme?: string | null;
    };
    return { preferredTheme: updated.preferredTheme ?? null };
  }

  @Post('me/profile-picture')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.USER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nebyl poskytnut žádný soubor');
    }

    // Delete old profile picture if it exists
    const existingUser = await this.usersService.findOne(user.id);
    if (existingUser.profilePictureUrl) {
      await this.profilePictureService.deleteImage(user.id);
    }

    // Process and save new image
    const profilePictureUrl =
      await this.profilePictureService.processAndSaveImage(file, user.id);

    // Update user with new profile picture URL
    await this.usersService.update(user.id, { profilePictureUrl });

    return { profilePictureUrl };
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/role')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
    @GetUser() actor: User,
  ) {
    return this.usersService.updateUserRole(id, dto.role, actor);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }

  @Get(':id/stats')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.USER)
  async getUserStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.userStatsService.getUserStats(id);
  }

  @Post(':id/register-token')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async generateRegisterToken(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.generateRegisterToken(id);
  }
}
