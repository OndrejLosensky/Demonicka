import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreferences } from './entities/user-preferences.entity';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';

@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectRepository(UserPreferences)
    private readonly preferencesRepository: Repository<UserPreferences>,
  ) {}

  async findByUserId(userId: string): Promise<UserPreferences> {
    const preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      // Create default preferences if none exist
      return this.preferencesRepository.save(
        this.preferencesRepository.create({ userId }),
      );
    }

    return preferences;
  }

  async update(
    userId: string,
    updateDto: UpdateUserPreferencesDto,
  ): Promise<UserPreferences> {
    const preferences = await this.findByUserId(userId);

    // Update only provided fields
    Object.assign(preferences, updateDto);

    return this.preferencesRepository.save(preferences);
  }
} 