import { AchievementType, AchievementCategory } from '@prisma/client';

export class AchievementDto {
  id: string;
  name: string;
  description: string | null;
  type: AchievementType;
  category: AchievementCategory;
  targetValue: number;
  points: number;
  icon: string | null;
  isActive: boolean;
  isRepeatable: boolean;
  maxCompletions: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UserAchievementDto {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  isCompleted: boolean;
  completedAt: Date | null;
  completionCount: number;
  lastProgressUpdate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  achievement: AchievementDto;
}

export class UserAchievementsResponseDto {
  achievements: UserAchievementDto[];
  totalPoints: number;
  completedCount: number;
  totalCount: number;
}

export class GlobalAchievementDto extends UserAchievementDto {
  globalCompletionPercent: number;
}

export class GlobalAchievementsResponseDto {
  achievements: GlobalAchievementDto[];
  totalUsers: number;
}

export class CreateAchievementDto {
  name: string;
  description?: string;
  type: AchievementType;
  category?: AchievementCategory;
  targetValue: number;
  points?: number;
  icon?: string;
  isActive?: boolean;
  isRepeatable?: boolean;
  maxCompletions?: number;
}

export class UpdateAchievementDto {
  name?: string;
  description?: string;
  type?: AchievementType;
  category?: AchievementCategory;
  targetValue?: number;
  points?: number;
  icon?: string;
  isActive?: boolean;
  isRepeatable?: boolean;
  maxCompletions?: number;
}
