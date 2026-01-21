import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import * as bcrypt from 'bcrypt';

import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { subDays } from 'date-fns';
import { LoggingService } from '../logging/logging.service';
import { LeaderboardGateway } from '../leaderboard/leaderboard.gateway';

/**
 * Users Service
 *
 * Registration tokens are now generated in the format: username-randomNumber
 * Example: "Ondrej-2345" where the number is between 1000-9999
 * This makes tokens more user-friendly and memorable while maintaining uniqueness.
 */

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private readonly loggingService: LoggingService,
    private readonly leaderboardGateway: LeaderboardGateway,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    createdBy?: string,
  ): Promise<UserWithoutPassword> {
    // Check if username is already taken
    const existingUser = await this.findByUsername(createUserDto.username);
    if (existingUser) {
      throw new BadRequestException('Uživatelské jméno již existuje');
    }

    const savedUser = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: createUserDto.password
          ? await bcrypt.hash(createUserDto.password, 10)
          : null,
        isRegistrationComplete: true,
        role: UserRole.USER,
        canLogin: true, // USER can login
        createdBy: createdBy || null,
      },
    });

    // Log user creation
    this.loggingService.logUserCreated(
      savedUser.id,
      savedUser.name || 'Unknown',
      savedUser.gender || 'Unknown',
    );

    // Emit live updates for leaderboard and dashboard stats
    await this.leaderboardGateway.emitFullUpdate();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = savedUser;
    return result;
  }

  async createParticipant(
    createParticipantDto: CreateParticipantDto,
    createdBy?: string,
  ): Promise<UserWithoutPassword> {
    // Generate username-based token with random number
    const randomNumber = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    const registrationToken = `${createParticipantDto.username}-${randomNumber}`;

    const savedUser = await this.prisma.user.create({
      data: {
        ...createParticipantDto,
        registrationToken,
        isRegistrationComplete: false,
        role: UserRole.PARTICIPANT,
        canLogin: false, // PARTICIPANT cannot login
        createdBy: createdBy || null,
      },
    });

    // Log user creation
    this.loggingService.logUserCreated(
      savedUser.id,
      savedUser.name || 'Unknown',
      savedUser.gender || 'Unknown',
    );

    // Emit live updates for leaderboard and dashboard stats
    await this.leaderboardGateway.emitFullUpdate();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = savedUser;
    return result;
  }

  async findAll(withDeleted = false): Promise<User[]> {
    return this.prisma.user.findMany({
      where: withDeleted ? {} : { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findDeleted(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        deletedAt: { not: null },
      },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findByRegistrationToken(token: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { registrationToken: token },
    });
  }

  async getUsernameFromToken(token: string): Promise<{ username: string }> {
    const user = await this.findByRegistrationToken(token);
    if (!user) {
      throw new NotFoundException('Neplatný registrační token');
    }
    if (!user.username) {
      throw new BadRequestException('Uživatel nemá uživatelské jméno');
    }
    // Use the stored username (do not parse token format; usernames may contain '-' or spaces)
    return { username: user.username };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id); // Verify user exists
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async updateSettings(
    id: string,
    dto: UpdateUserSettingsDto,
  ): Promise<User> {
    await this.findOne(id); // Verify user exists
    return this.prisma.user.update({
      where: { id },
      data: {
        preferredTheme: dto.preferredTheme ?? null,
      },
    });
  }

  async updateUserRole(targetUserId: string, role: UserRole, actor: User) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        role: true,
        deletedAt: true,
      },
    });

    if (!target) {
      throw new NotFoundException('Uživatel nebyl nalezen');
    }

    if (target.deletedAt) {
      throw new BadRequestException(
        'Uživatel je smazán. Nejprve jej obnovte a poté změňte roli.',
      );
    }

    if (actor.role === UserRole.OPERATOR) {
      if (target.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Operátor nemůže měnit roli super admina');
      }
      if (role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Operátor nemůže přiřadit roli super admin');
      }
    }

    const canLogin = role !== UserRole.PARTICIPANT;

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        role,
        canLogin,
      },
      select: {
        id: true,
        username: true,
        role: true,
        canLogin: true,
        isRegistrationComplete: true,
        isTwoFactorEnabled: true,
        lastAdminLogin: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async cleanup(): Promise<void> {
    await this.prisma.user.deleteMany({
      where: {
        isRegistrationComplete: false,
        createdAt: { lt: subDays(new Date(), 7) },
      },
    });
  }

  async completeRegistration(
    completeRegistrationDto: CompleteRegistrationDto,
  ): Promise<UserWithoutPassword> {
    const user = await this.findByRegistrationToken(
      completeRegistrationDto.registrationToken,
    );

    if (!user) {
      throw new NotFoundException('Neplatný registrační token');
    }

    if (user.isRegistrationComplete) {
      throw new BadRequestException('Registrace již byla dokončena');
    }

    // Check if username is already taken by another user (excluding the current user)
    const existingUser = await this.findByUsername(
      completeRegistrationDto.username,
    );
    if (existingUser && existingUser.id !== user.id) {
      throw new BadRequestException('Uživatelské jméno již existuje');
    }

    // Update user with new information
    const savedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        username: completeRegistrationDto.username,
        password: await bcrypt.hash(completeRegistrationDto.password, 10),
        isRegistrationComplete: true,
        registrationToken: null, // Clear the token after successful registration
        role: UserRole.USER, // Update role to USER
        canLogin: true, // Enable login after completing registration
      },
    });

    this.loggingService.logParticipantRegistered(
      savedUser.id,
      savedUser.username,
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = savedUser;
    return result;
  }

  async promoteToAdmin(username: string): Promise<UserWithoutPassword> {
    const user = await this.findByUsername(username);

    if (!user) {
      throw new NotFoundException(`Uživatel ${username} nebyl nalezen`);
    }

    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.OPERATOR) {
      throw new BadRequestException(
        `Uživatel ${username} je již operátor nebo super admin`,
      );
    }

    const savedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.OPERATOR, canLogin: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = savedUser;
    return result;
  }

  async generateRegisterToken(userId: string): Promise<{ token: string }> {
    const user = await this.findOne(userId);

    if (!user) {
      throw new NotFoundException('Uživatel nebyl nalezen');
    }

    if (user.role !== UserRole.PARTICIPANT) {
      throw new BadRequestException(
        'Registrační token lze vygenerovat pouze pro účastníky',
      );
    }

    if (user.isRegistrationComplete) {
      throw new BadRequestException('Uživatel již dokončil registraci');
    }

    // Generate username-based token with random number
    const randomNumber = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    const registrationToken = `${user.username}-${randomNumber}`;

    await this.prisma.user.update({
      where: { id: user.id },
      data: { registrationToken },
    });

    return { token: registrationToken };
  }
}
