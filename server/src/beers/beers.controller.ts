import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { BeersService } from './beers.service';
import { Beer } from './entities/beer.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';

/**
 * Controller for managing beers.
 * All routes are protected by JWT authentication, prefixed with '/users/:userId/beers',
 * and require a valid JWT token.
 */
@Controller('users/:userId/beers')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class BeersController {
  constructor(private readonly beersService: BeersService) {}

  /**
   * Create a new beer for a user.
   * @route POST /users/:userId/beers
   * @param userId - The ID of the user
   * @returns The created beer
   */
  @Public()
  @Post()
  create(@Param('userId', ParseUUIDPipe) userId: string): Promise<Beer> {
    return this.beersService.create(userId);
  }

  /**
   * Get all beers for a user.
   * @route GET /users/:userId/beers
   * @param userId - The ID of the user
   * @returns Array of beers
   */
  @Public()
  @Get()
  findByUserId(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Beer>> {
    return this.beersService.findByUserId(userId, paginationDto.take, paginationDto.skip);
  }

  /**
   * Get beer count for a user.
   * @route GET /users/:userId/beers/count
   * @param userId - The ID of the user
   * @returns The number of beers
   */
  @Public()
  @Get('count')
  getBeerCount(@Param('userId', ParseUUIDPipe) userId: string): Promise<number> {
    return this.beersService.getUserBeerCount(userId);
  }
}
