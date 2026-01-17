import { IsString, IsUUID } from 'class-validator';

export class CreateEventBeerPongTeamDto {
  @IsString()
  name: string;

  @IsUUID()
  player1Id: string;

  @IsUUID()
  player2Id: string;
}
