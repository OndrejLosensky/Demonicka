import { User } from '../../users/entities/user.entity';

export class SystemUserDto {
  id: string;
  username: string;
  role: string;
  isRegistrationComplete: boolean;
  isTwoFactorEnabled: boolean;
  isAdminLoginEnabled: boolean;
  lastAdminLogin: Date | null;
}

export class SystemStatsDto {
  users: SystemUserDto[];
  totalUsers: number;
  totalAdminUsers: number;
  totalCompletedRegistrations: number;
  total2FAEnabled: number;
} 