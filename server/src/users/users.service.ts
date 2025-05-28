import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      password: createUserDto.password ? await bcrypt.hash(createUserDto.password, 10) : null,
      isRegistrationComplete: true,
    });
    const savedUser = await this.usersRepository.save(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = savedUser;
    return result;
  }

  async createParticipant(createParticipantDto: CreateParticipantDto): Promise<UserWithoutPassword> {
    // Generate a unique username based on the name
    const baseUsername = createParticipantDto.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;
    
    // Keep trying until we find a unique username
    while (await this.findByUsername(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Generate a registration token for future account completion
    const registrationToken = uuidv4();

    const user = this.usersRepository.create({
      ...createParticipantDto,
      username,
      password: null,
      registrationToken,
      isRegistrationComplete: false,
    });

    const savedUser = await this.usersRepository.save(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = savedUser;
    return result;
  }

  async findAll(): Promise<UserWithoutPassword[]> {
    const users = await this.usersRepository.find();
    return users.map(({ password: _, ...user }) => user);
  }

  async findOne(id: string): Promise<UserWithoutPassword | null> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findByRegistrationToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { registrationToken: token } });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserWithoutPassword> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.usersRepository.update(id, updateUserDto);
    const updatedUser = await this.usersRepository.findOne({ where: { id } });
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = updatedUser;
    return result;
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
