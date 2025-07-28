import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement, AchievementType } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { User } from '../users/entities/user.entity';
import { EventBeer } from '../events/entities/event-beer.entity';
import { Event } from '../events/entities/event.entity';
import {
  AchievementDto,
  UserAchievementDto,
  UserAchievementsResponseDto,
  CreateAchievementDto,
  UpdateAchievementDto,
} from './dto/achievement.dto';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepository: Repository<UserAchievement>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(EventBeer)
    private readonly eventBeerRepository: Repository<EventBeer>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async getUserAchievements(userId: string): Promise<UserAchievementsResponseDto> {
    const userAchievements = await this.userAchievementRepository.find({
      where: { userId },
      relations: ['achievement'],
      order: { createdAt: 'ASC' },
    });

    const totalPoints = userAchievements
      .filter(ua => ua.isCompleted)
      .reduce((sum, ua) => sum + (ua.achievement.points * ua.completionCount), 0);

    const completedCount = userAchievements.filter(ua => ua.isCompleted).length;
    const totalCount = userAchievements.length;

    return {
      achievements: userAchievements.map(ua => this.mapToUserAchievementDto(ua)),
      totalPoints,
      completedCount,
      totalCount,
    };
  }

  async checkAndUpdateAchievements(userId: string): Promise<void> {
    this.logger.log(`Checking achievements for user: ${userId}`);

    // Get all active achievements
    const achievements = await this.achievementRepository.find({
      where: { isActive: true },
    });

    for (const achievement of achievements) {
      await this.checkAchievement(userId, achievement);
    }
  }

  private async checkAchievement(userId: string, achievement: Achievement): Promise<void> {
    // Get or create user achievement record
    let userAchievement = await this.userAchievementRepository.findOne({
      where: { userId, achievementId: achievement.id },
    });

    if (!userAchievement) {
      userAchievement = this.userAchievementRepository.create({
        userId,
        achievementId: achievement.id,
        progress: 0,
        isCompleted: false,
        completionCount: 0,
      });
    }

    // Check if already completed and not repeatable
    if (userAchievement.isCompleted && !achievement.isRepeatable) {
      return;
    }

    // Check if max completions reached
    if (userAchievement.completionCount >= achievement.maxCompletions) {
      return;
    }

    // Calculate current progress based on achievement type
    const currentProgress = await this.calculateProgress(userId, achievement);
    
    if (currentProgress >= achievement.targetValue) {
      // Achievement completed
      if (!userAchievement.isCompleted) {
        userAchievement.isCompleted = true;
        userAchievement.completedAt = new Date();
        this.logger.log(`Achievement ${achievement.name} completed by user ${userId}`);
      }
      
      userAchievement.completionCount += 1;
      userAchievement.progress = achievement.targetValue;
      
      // If repeatable, reset for next completion
      if (achievement.isRepeatable) {
        userAchievement.isCompleted = false;
        userAchievement.completedAt = null;
      }
    } else {
      userAchievement.progress = currentProgress;
    }

    userAchievement.lastProgressUpdate = new Date();
    await this.userAchievementRepository.save(userAchievement);
  }

  private async calculateProgress(userId: string, achievement: Achievement): Promise<number> {
    switch (achievement.type) {
      case AchievementType.TOTAL_BEERS:
        return await this.calculateTotalBeers(userId);
      
      case AchievementType.BEERS_IN_EVENT:
        return await this.calculateBeersInEvent(userId);
      
      case AchievementType.BEERS_IN_HOUR:
        return await this.calculateBeersInHour(userId);
      
      case AchievementType.EVENTS_PARTICIPATED:
        return await this.calculateEventsParticipated(userId);
      
      case AchievementType.EVENT_WIN:
        return await this.calculateEventWins(userId);
      
      case AchievementType.FIRST_BEER:
        return await this.calculateFirstBeer(userId);
      
      case AchievementType.CONSECUTIVE_DAYS:
        return await this.calculateConsecutiveDays(userId);
      
      default:
        return 0;
    }
  }

  private async calculateTotalBeers(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    return user?.beerCount || 0;
  }

  private async calculateBeersInEvent(userId: string): Promise<number> {
    // Get the most recent event where user participated
    const recentEventBeer = await this.eventBeerRepository.findOne({
      where: { userId },
      order: { consumedAt: 'DESC' },
      relations: ['event'],
    });

    if (!recentEventBeer) return 0;

    const eventBeers = await this.eventBeerRepository.count({
      where: {
        userId,
        eventId: recentEventBeer.eventId,
      },
    });

    return eventBeers;
  }

  private async calculateBeersInHour(userId: string): Promise<number> {
    // Get beers from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const recentBeers = await this.eventBeerRepository.find({
      where: {
        userId,
        consumedAt: { $gte: oneHourAgo } as any,
      },
      order: { consumedAt: 'ASC' },
    });

    if (recentBeers.length === 0) return 0;

    // Group beers by hour and find the hour with most beers
    const hourlyCounts = new Map<number, number>();
    
    recentBeers.forEach(beer => {
      const hour = new Date(beer.consumedAt).getHours();
      hourlyCounts.set(hour, (hourlyCounts.get(hour) || 0) + 1);
    });

    return Math.max(...hourlyCounts.values());
  }

  private async calculateEventsParticipated(userId: string): Promise<number> {
    const eventCount = await this.eventRepository
      .createQueryBuilder('event')
      .innerJoin('event.users', 'user', 'user.id = :userId', { userId })
      .getCount();

    return eventCount;
  }

  private async calculateEventWins(userId: string): Promise<number> {
    // Get all events where user participated
    const userEvents = await this.eventRepository
      .createQueryBuilder('event')
      .innerJoin('event.users', 'user', 'user.id = :userId', { userId })
      .getMany();

    let wins = 0;

    for (const event of userEvents) {
      // Get all users' beer counts for this event
      const userBeerCounts = await this.eventBeerRepository
        .createQueryBuilder('eventBeer')
        .select(['eventBeer.userId', 'COUNT(*) as count'])
        .where('eventBeer.eventId = :eventId', { eventId: event.id })
        .groupBy('eventBeer.userId')
        .orderBy('count', 'DESC')
        .getRawMany();

      if (userBeerCounts.length > 0) {
        const topUser = userBeerCounts[0];
        if (topUser.eventBeer_userId === userId) {
          wins++;
        }
      }
    }

    return wins;
  }

  private async calculateFirstBeer(userId: string): Promise<number> {
    const firstBeer = await this.eventBeerRepository.findOne({
      where: { userId },
      order: { consumedAt: 'ASC' },
    });

    return firstBeer ? 1 : 0;
  }

  private async calculateConsecutiveDays(userId: string): Promise<number> {
    // Get all beer dates for the user
    const beerDates = await this.eventBeerRepository
      .createQueryBuilder('eventBeer')
      .select('DATE(eventBeer.consumedAt) as date')
      .where('eventBeer.userId = :userId', { userId })
      .groupBy('DATE(eventBeer.consumedAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    if (beerDates.length === 0) return 0;

    let maxConsecutive = 1;
    let currentConsecutive = 1;

    for (let i = 1; i < beerDates.length; i++) {
      const prevDate = new Date(beerDates[i - 1].date);
      const currDate = new Date(beerDates[i].date);
      
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }

    return maxConsecutive;
  }

  private mapToUserAchievementDto(userAchievement: UserAchievement): UserAchievementDto {
    return {
      id: userAchievement.id,
      userId: userAchievement.userId,
      achievementId: userAchievement.achievementId,
      progress: userAchievement.progress,
      isCompleted: userAchievement.isCompleted,
      completedAt: userAchievement.completedAt,
      completionCount: userAchievement.completionCount,
      lastProgressUpdate: userAchievement.lastProgressUpdate,
      createdAt: userAchievement.createdAt,
      updatedAt: userAchievement.updatedAt,
      achievement: {
        id: userAchievement.achievement.id,
        name: userAchievement.achievement.name,
        description: userAchievement.achievement.description,
        type: userAchievement.achievement.type,
        category: userAchievement.achievement.category,
        targetValue: userAchievement.achievement.targetValue,
        points: userAchievement.achievement.points,
        icon: userAchievement.achievement.icon,
        isActive: userAchievement.achievement.isActive,
        isRepeatable: userAchievement.achievement.isRepeatable,
        maxCompletions: userAchievement.achievement.maxCompletions,
        createdAt: userAchievement.achievement.createdAt,
        updatedAt: userAchievement.achievement.updatedAt,
      },
    };
  }

  // Admin methods for managing achievements
  async createAchievement(createDto: CreateAchievementDto): Promise<AchievementDto> {
    const achievement = this.achievementRepository.create(createDto);
    const saved = await this.achievementRepository.save(achievement);
    return this.mapToAchievementDto(saved);
  }

  async updateAchievement(id: string, updateDto: UpdateAchievementDto): Promise<AchievementDto> {
    await this.achievementRepository.update(id, updateDto);
    const achievement = await this.achievementRepository.findOne({ where: { id } });
    if (!achievement) {
      throw new Error(`Achievement with id ${id} not found`);
    }
    return this.mapToAchievementDto(achievement);
  }

  async deleteAchievement(id: string): Promise<void> {
    await this.achievementRepository.softDelete(id);
  }

  async getAllAchievements(): Promise<AchievementDto[]> {
    const achievements = await this.achievementRepository.find({
      order: { category: 'ASC', targetValue: 'ASC' },
    });
    return achievements.map(a => this.mapToAchievementDto(a));
  }

  private mapToAchievementDto(achievement: Achievement): AchievementDto {
    return {
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      type: achievement.type,
      category: achievement.category,
      targetValue: achievement.targetValue,
      points: achievement.points,
      icon: achievement.icon,
      isActive: achievement.isActive,
      isRepeatable: achievement.isRepeatable,
      maxCompletions: achievement.maxCompletions,
      createdAt: achievement.createdAt,
      updatedAt: achievement.updatedAt,
    };
  }
} 