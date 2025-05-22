import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BeersService } from './beers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Beer } from './entities/beer.entity';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';

/**
 * Controller for managing beer consumption records.
 * All routes are protected by JWT authentication, prefixed with '/participants/:participantId/beers',
 * and support API versioning.
 */
@Controller('participants/:participantId/beers')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class BeersController {
  constructor(private readonly beersService: BeersService) {}

  /**
   * Add a beer record for a participant
   * @route POST /participants/:participantId/beers
   * @param participantId - UUID of the participant
   * @returns {Promise<Beer>} The newly created beer record
   * @throws {NotFoundException} When participant is not found
   */
  @Post()
  async addBeer(@Param('participantId') participantId: string): Promise<Beer> {
    return this.beersService.addBeer(participantId);
  }

  /**
   * Remove the most recently added beer for a participant
   * @route DELETE /participants/:participantId/beers
   * @param participantId - UUID of the participant
   * @throws {NotFoundException} When participant has no beers or is not found
   */
  @Delete()
  async removeLastBeer(@Param('participantId') participantId: string): Promise<void> {
    return this.beersService.removeLastBeer(participantId);
  }

  /**
   * Get all beer records for a participant
   * @route GET /participants/:participantId/beers
   * @param participantId - UUID of the participant
   * @returns {Promise<Beer[]>} Array of beer records ordered by creation date (newest first)
   * @throws {NotFoundException} When participant is not found
   */
  @Get()
  async getParticipantBeers(
    @Param('participantId') participantId: string,
  ): Promise<Beer[]> {
    return this.beersService.getParticipantBeers(participantId);
  }

  /**
   * Get total number of beers consumed by a participant
   * @route GET /participants/:participantId/beers/count
   * @param participantId - UUID of the participant
   * @returns {Promise<{count: number}>} Object containing the total count of beers
   * @throws {NotFoundException} When participant is not found
   */
  @Get('count')
  async getBeerCount(
    @Param('participantId') participantId: string,
  ): Promise<{ count: number }> {
    const count = await this.beersService.getBeerCount(participantId);
    return { count };
  }
} 