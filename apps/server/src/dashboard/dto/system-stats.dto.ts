export class SystemUserDto {
  id: string;
  username: string | null;
  role: string;
  isRegistrationComplete: boolean;
  isTwoFactorEnabled: boolean;
  canLogin: boolean;
  lastAdminLogin: Date | null;
}

export class SystemStatsDto {
  users: SystemUserDto[];
  totalUsers: number;
  totalOperatorUsers: number;
  totalCompletedRegistrations: number;
  total2FAEnabled: number;
} 