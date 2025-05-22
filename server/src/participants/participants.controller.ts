import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';

/**
 * Controller for managing participants in the beer tracking system.
 * All routes are protected by JWT authentication, prefixed with '/participants',
 * and support API versioning.
 * Participants represent users whose beer consumption is being tracked.
 */
@Controller('participants')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  /**
   * Create a new participant
   * @route POST /participants
   * @param createParticipantDto - Data for creating a new participant
   * @returns {Promise<Participant>} The newly created participant
   * @throws {ConflictException} When participant with the same name already exists
   */
  @Post('cleanup')
  cleanup() {
    return this.participantsService.cleanup();
  }

  @Post()
  create(@Body() createParticipantDto: CreateParticipantDto) {
    return this.participantsService.create(createParticipantDto);
  }

  /**
   * Get all participants
   * @route GET /participants
   * @returns {Promise<Participant[]>} Array of all participants
   */
  @Get()
  findAll(@Query('withDeleted') withDeleted?: boolean) {
    return this.participantsService.findAll(withDeleted);
  }

  @Get('deleted')
  findDeleted() {
    return this.participantsService.findDeleted();
  }

  /**
   * Get a specific participant by ID
   * @route GET /participants/:id
   * @param id - UUID of the participant
   * @returns {Promise<Participant>} The requested participant
   * @throws {NotFoundException} When participant is not found
   */
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('withDeleted') withDeleted?: boolean,
  ) {
    return this.participantsService.findOne(id, withDeleted);
  }

  /**
   * Update a participant's information
   * @route PATCH /participants/:id
   * @param id - UUID of the participant
   * @param updateParticipantDto - Data to update on the participant
   * @returns {Promise<Participant>} The updated participant
   * @throws {NotFoundException} When participant is not found
   * @throws {ConflictException} When trying to update to a name that already exists
   */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateParticipantDto: UpdateParticipantDto,
  ) {
    return this.participantsService.update(id, updateParticipantDto);
  }

  /**
   * Delete a participant
   * @route DELETE /participants/:id
   * @param id - UUID of the participant
   * @returns {Promise<void>}
   * @throws {NotFoundException} When participant is not found
   */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.participantsService.remove(id);
  }
}
