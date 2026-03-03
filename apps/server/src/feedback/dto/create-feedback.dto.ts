import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  @MinLength(1, { message: 'Zpráva nesmí být prázdná' })
  @MaxLength(5000, { message: 'Zpráva může mít maximálně 5000 znaků' })
  message: string;

  @IsOptional()
  @IsString()
  source?: 'web' | 'mobile';
}
