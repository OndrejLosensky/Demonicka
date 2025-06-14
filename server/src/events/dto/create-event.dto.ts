import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateEventDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;
} 