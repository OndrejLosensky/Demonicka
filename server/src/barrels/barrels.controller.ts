import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BarrelsService } from './barrels.service';
import { CreateBarrelDto } from './dto/create-barrel.dto';
import { UpdateBarrelDto } from './dto/update-barrel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Barrel } from './entities/barrel.entity';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { GetBarrelsDto } from './dto/get-barrels.dto';

@Controller('barrels')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class BarrelsController {
  constructor(private readonly barrelsService: BarrelsService) {}

  @Get('active/current')
  getActiveBarrel() {
    return this.barrelsService.getActiveBarrel();
  }

  @Get('deleted')
  findDeleted(@Query() paginationDto: PaginationDto): Promise<PaginatedResponse<Barrel>> {
    return this.barrelsService.findDeleted(paginationDto.take, paginationDto.skip);
  }

  @Post('cleanup')
  cleanup() {
    return this.barrelsService.cleanup();
  }

  @Get()
  findAll(
    @Query() query: GetBarrelsDto,
  ): Promise<PaginatedResponse<Barrel>> {
    return this.barrelsService.findAll(
      query.includeDeleted,
      query.take,
      query.skip,
    );
  }

  @Post()
  create(@Body() createBarrelDto: CreateBarrelDto): Promise<Barrel> {
    return this.barrelsService.create(createBarrelDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Barrel> {
    return this.barrelsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBarrelDto: UpdateBarrelDto,
  ): Promise<Barrel> {
    return this.barrelsService.update(id, updateBarrelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.barrelsService.remove(id);
  }

  @Patch(':id/activate')
  setActive(@Param('id') id: string): Promise<Barrel> {
    return this.barrelsService.setActive(id);
  }
}
