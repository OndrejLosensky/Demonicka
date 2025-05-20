import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequestUser } from './decorators/user.decorator';

/**
 * Users controller handling user profile management.
 * All routes are prefixed with '/users' and protected by JWT authentication.
 */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get user profile by ID
   * @param id User ID to fetch
   * @param currentUser Currently authenticated user
   * @returns User profile data
   * @throws ForbiddenException if user tries to access another user's profile
   */
  @Get(':id')
  async getUserProfile(
    @Param('id', ParseIntPipe) id: number,
    @RequestUser() currentUser: User,
  ): Promise<User> {
    // Only allow users to access their own profile
    if (currentUser.id !== id) {
      throw new ForbiddenException('You can only access your own profile');
    }
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Update user profile
   * @param id User ID to update
   * @param updateUserDto Updated user data
   * @param currentUser Currently authenticated user
   * @returns Updated user profile
   * @throws ForbiddenException if user tries to update another user's profile
   */
  @Patch(':id')
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @RequestUser() currentUser: User,
  ): Promise<User> {
    // Only allow users to update their own profile
    if (currentUser.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.usersService.update(id, updateUserDto);
  }
}
