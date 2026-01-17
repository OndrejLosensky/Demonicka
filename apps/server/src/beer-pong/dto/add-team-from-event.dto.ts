import { IsUUID } from 'class-validator';

export class AddTeamFromEventDto {
  @IsUUID()
  eventBeerPongTeamId: string;
}
