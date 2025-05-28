import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateEventDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString()
    @IsOptional()
    startDate?: string;
} 