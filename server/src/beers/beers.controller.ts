import { Controller, Get, Post, Delete, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { BeersService } from './beers.service';
import { Beer } from './entities/beer.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Controller for managing beers.
 * All routes are protected by JWT authentication, prefixed with '/users/:userId/beers',
 * and require a valid JWT token.
 */
@Controller('users/:userId/beers')
@UseGuards(JwtAuthGuard)
export class BeersController {
  constructor(private readonly beersService: BeersService) {}

  /**
   * Create a new beer for a user.
   * @route POST /users/:userId/beers
   * @param userId - The ID of the user
   * @returns The created beer
   */
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
  @Get()
  findByUserId(@Param('userId', ParseUUIDPipe) userId: string): Promise<Beer[]> {
    return this.beersService.findByUserId(userId);
  }

  /**
   * Get beer count for a user.
   * @route GET /users/:userId/beers/count
   * @param userId - The ID of the user
   * @returns The number of beers
   */
  @Get('count')
  getBeerCount(@Param('userId', ParseUUIDPipe) userId: string): Promise<number> {
    return this.beersService.getUserBeerCount(userId);
  }
}
