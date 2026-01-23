import { IsEnum, IsInt, Min, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { LeaderboardViewMode } from '@prisma/client';

export class UpdateLeaderboardViewSettingsDto {
  @IsOptional()
  @IsBoolean()
  autoSwitchEnabled?: boolean;

  @IsOptional()
  @IsEnum(LeaderboardViewMode)
  currentView?: LeaderboardViewMode;

  @IsOptional()
  @IsInt()
  @Min(5)
  switchIntervalSeconds?: number;

  @IsOptional()
  @IsUUID()
  selectedBeerPongEventId?: string | null;
}
