import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, LessThan } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { UserRole } from './enums/user-role.enum';
import { subDays } from 'date-fns';

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserWithoutPassword> {
    // Check if username is already taken
    const existingUser = await this.findByUsername(createUserDto.username);
    if (existingUser) {
      throw new BadRequestException('Uživatelské jméno již existuje');
    }

    const user = this.usersRepository.create({
      ...createUserDto,
      password: createUserDto.password
        ? await bcrypt.hash(createUserDto.password, 10)
        : null,
      isRegistrationComplete: true,
      role: UserRole.USER, // Changed from ADMIN to USER
    });
    const savedUser = await this.usersRepository.save(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = savedUser;
    return result;
  }

  async createParticipant(
    createParticipantDto: CreateParticipantDto,
  ): Promise<UserWithoutPassword> {
    const registrationToken = uuidv4();
    const user = this.usersRepository.create({
      ...createParticipantDto,
      registrationToken,
      isRegistrationComplete: false,
      role: UserRole.PARTICIPANT,
    });
    const savedUser = await this.usersRepository.save(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = savedUser;
    return result;
  }

  async findAll(withDeleted = false): Promise<User[]> {
    return this.usersRepository.find({
      where: withDeleted ? {} : { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findDeleted(): Promise<User[]> {
    return this.usersRepository.find({
      withDeleted: true,
      where: {
        deletedAt: Not(IsNull()),
      },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
    });
  }

  async findByRegistrationToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { registrationToken: token },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const updatedUser = { ...user, ...updateUserDto };
    return this.usersRepository.save(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.usersRepository.restore(id);
  }

  async cleanup(): Promise<void> {
    await this.usersRepository.delete({
      isRegistrationComplete: false,
      createdAt: LessThan(subDays(new Date(), 7)),
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

    // Check if username is already taken
    const existingUser = await this.findByUsername(
      completeRegistrationDto.username,
    );
    if (existingUser) {
      throw new BadRequestException('Uživatelské jméno již existuje');
    }

    // Update user with new information
    user.username = completeRegistrationDto.username;
    user.password = await bcrypt.hash(completeRegistrationDto.password, 10);
    user.isRegistrationComplete = true;
    user.registrationToken = null; // Clear the token after successful registration
    user.role = UserRole.USER; // Update role to USER

    const savedUser = await this.usersRepository.save(user);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = savedUser;
    return result;
  }

  async promoteToAdmin(username: string): Promise<UserWithoutPassword> {
    const user = await this.findByUsername(username);
    
    if (!user) {
      throw new NotFoundException(`Uživatel ${username} nebyl nalezen`);
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException(`Uživatel ${username} je již admin`);
    }

    user.role = UserRole.ADMIN;
    const savedUser = await this.usersRepository.save(user);
    
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
      throw new BadRequestException('Registrační token lze vygenerovat pouze pro účastníky');
    }

    if (user.isRegistrationComplete) {
      throw new BadRequestException('Uživatel již dokončil registraci');
    }

    const registrationToken = uuidv4();
    user.registrationToken = registrationToken;
    await this.usersRepository.save(user);

    return { token: registrationToken };
  }
}
