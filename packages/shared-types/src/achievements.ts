export enum AchievementType {
  EVENT_WIN = 'EVENT_WIN',
  BEERS_IN_EVENT = 'BEERS_IN_EVENT',
  BEERS_IN_HOUR = 'BEERS_IN_HOUR',
  EVENTS_PARTICIPATED = 'EVENTS_PARTICIPATED',
  TOTAL_BEERS = 'TOTAL_BEERS',
  CONSECUTIVE_DAYS = 'CONSECUTIVE_DAYS',
  FIRST_BEER = 'FIRST_BEER',
  MILESTONE = 'MILESTONE',
}

export enum AchievementCategory {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
  LEGENDARY = 'LEGENDARY',
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  category: AchievementCategory;
  targetValue: number;
  points: number;
  icon: string;
  isActive: boolean;
  isRepeatable: boolean;
  maxCompletions: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  isCompleted: boolean;
  completedAt: string | null;
  completionCount: number;
  lastProgressUpdate: string | null;
  createdAt: string;
  updatedAt: string;
  achievement: Achievement;
}

export interface UserAchievementsResponse {
  achievements: UserAchievement[];
  totalPoints: number;
  completedCount: number;
  totalCount: number;
}

export interface CreateAchievementRequest {
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

export interface UpdateAchievementRequest {
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
