import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { EventRegistrationService } from './event-registration.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';

@Controller('registration')
@Versions('1')
@UseGuards(VersionGuard)
@Public()
export class RegistrationPublicController {
  constructor(private readonly registrationService: EventRegistrationService) {}

  @Get('by-token/:token')
  async getEventByToken(@Param('token') token: string) {
    return this.registrationService.getEventByToken(token);
  }

  @Post('by-token/:token')
  async createRegistration(
    @Param('token') token: string,
    @Body() createDto: CreateRegistrationDto,
  ) {
    return this.registrationService.createRegistration(token, createDto);
  }
}
