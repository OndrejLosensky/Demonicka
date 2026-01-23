import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@demonicka/shared';
import { EventRegistrationService } from './event-registration.service';
import { UserMatchingService } from './user-matching.service';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('events/:eventId/registration')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class RegistrationReviewController {
  constructor(
    private readonly registrationService: EventRegistrationService,
    private readonly userMatchingService: UserMatchingService,
  ) {}

  @Get()
  @Permissions(Permission.MANAGE_EVENT_USERS, Permission.MANAGE_PARTICIPANTS)
  async getRegistrations(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.registrationService.getRegistrations(eventId);
  }

  @Get('review')
  @Permissions(Permission.MANAGE_EVENT_USERS, Permission.MANAGE_PARTICIPANTS)
  async getRegistrationsWithSuggestions(@Param('eventId', ParseUUIDPipe) eventId: string) {
    const registrations = await this.registrationService.getRegistrations(eventId);

    // Add matching suggestions for registrations without matchedUserId
    const registrationsWithSuggestions = await Promise.all(
      registrations.map(async (reg) => {
        if (reg.matchedUserId) {
          return {
            ...reg,
            suggestedMatch: null,
            suggestedConfidence: null,
          };
        }

        const match = await this.userMatchingService.findBestMatch(reg.rawName, eventId);
        return {
          ...reg,
          suggestedMatch: match.user
            ? {
                id: match.user.id,
                name: match.user.name,
                firstName: match.user.firstName,
                lastName: match.user.lastName,
                username: match.user.username,
              }
            : null,
          suggestedConfidence: match.confidence,
        };
      }),
    );

    return registrationsWithSuggestions;
  }

  @Patch(':registrationId')
  @Permissions(Permission.MANAGE_EVENT_USERS, Permission.MANAGE_PARTICIPANTS)
  async updateRegistration(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Body() updateDto: UpdateRegistrationDto,
  ) {
    return this.registrationService.updateRegistration(eventId, registrationId, updateDto);
  }

  @Post('apply')
  @Permissions(Permission.MANAGE_EVENT_USERS, Permission.MANAGE_PARTICIPANTS)
  async applyRegistrations(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.registrationService.applyRegistrations(eventId);
  }

  @Get('export/excel')
  @Permissions(Permission.MANAGE_EVENT_USERS, Permission.MANAGE_PARTICIPANTS)
  async exportRegistrations(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.registrationService.exportRegistrationsToExcel(eventId);
  }

  @Post('import/excel')
  @Permissions(Permission.MANAGE_EVENT_USERS, Permission.MANAGE_PARTICIPANTS)
  @UseInterceptors(FileInterceptor('file'))
  async importRegistrations(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nebyl poskytnut žádný soubor');
    }

    return this.registrationService.importRegistrationsFromExcel(eventId, file);
  }
}
