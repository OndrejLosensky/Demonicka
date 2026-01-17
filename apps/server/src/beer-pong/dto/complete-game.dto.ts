import { IsUUID } from 'class-validator';

export class CompleteGameDto {
  @IsUUID()
  winnerTeamId: string;
}
