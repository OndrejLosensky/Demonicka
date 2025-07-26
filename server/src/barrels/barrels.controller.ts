import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BarrelsService } from './barrels.service';
import { CreateBarrelDto } from './dto/create-barrel.dto';
import { UpdateBarrelDto } from './dto/update-barrel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Barrel } from './entities/barrel.entity';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { BypassAuth } from 'src/auth/decorators/bypass-auth.decorator';

@Controller('barrels')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class BarrelsController {
  constructor(private readonly barrelsService: BarrelsService) {}

  @Get('active/current')
  @BypassAuth()
  getActiveBarrel() {
    return this.barrelsService.getActiveBarrel();
  }

  @Get('deleted')
  findDeleted() {
    return this.barrelsService.findDeleted();
  }

  @Post('cleanup')
  cleanup() {
    return this.barrelsService.cleanup();
  }

  @Get()
  @BypassAuth()
  findAll(): Promise<Barrel[]> {
    return this.barrelsService.findAll();
  }

  @Post()
  @BypassAuth()
  create(@Body() createBarrelDto: CreateBarrelDto): Promise<Barrel> {
    return this.barrelsService.create(createBarrelDto);
  }

  @Get(':id')
  @BypassAuth()
  findOne(@Param('id') id: string): Promise<Barrel> {
    return this.barrelsService.findOne(id);
  }

  @Patch(':id')
  @BypassAuth()
  update(
    @Param('id') id: string,
    @Body() updateBarrelDto: UpdateBarrelDto,
  ): Promise<Barrel> {
    return this.barrelsService.update(id, updateBarrelDto);
  }

  @Delete(':id')
  @BypassAuth()
  remove(@Param('id') id: string): Promise<void> {
    return this.barrelsService.remove(id);
  }

  @Patch(':id/activate')
  @BypassAuth()
  setActive(@Param('id') id: string): Promise<Barrel> {
    return this.barrelsService.setActive(id);
  }
}
