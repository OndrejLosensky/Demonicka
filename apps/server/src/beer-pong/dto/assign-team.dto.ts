import { IsUUID, IsEnum } from 'class-validator';

export class AssignTeamDto {
  @IsUUID()
  teamId: string;

  @IsEnum(['team1', 'team2'])
  position: 'team1' | 'team2';
}
