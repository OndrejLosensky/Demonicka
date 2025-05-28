import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserWithoutPassword> {
    const user = this.usersRepository.create({
      ...createUserDto,
      password: createUserDto.password
        ? await bcrypt.hash(createUserDto.password, 10)
        : null,
      isRegistrationComplete: true,
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
      username: `participant_${Date.now()}`,
      registrationToken,
      isRegistrationComplete: false,
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
        deletedAt: IsNull(),
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
    await this.usersRepository.softRemove(user);
  }

  async restore(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.usersRepository.recover(user);
  }

  async cleanup(): Promise<void> {
    const users = await this.findAll(true);
    for (const user of users) {
      await this.usersRepository.softRemove(user);
    }
  }
}
