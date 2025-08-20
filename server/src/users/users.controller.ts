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
} from '@nestjs/common';
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
}
