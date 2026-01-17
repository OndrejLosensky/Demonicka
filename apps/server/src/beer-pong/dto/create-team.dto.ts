import { IsString, IsUUID } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  name: string;

  @IsUUID()
  player1Id: string;

  @IsUUID()
  player2Id: string;
}
