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
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { BarrelsService } from './barrels.service';
import { CreateBarrelDto } from './dto/create-barrel.dto';
import { UpdateBarrelDto } from './dto/update-barrel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Barrel } from '@prisma/client';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LoggingService } from '../logging/logging.service';
@Controller('barrels')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class BarrelsController {
  constructor(
    private readonly barrelsService: BarrelsService,
    private readonly loggingService: LoggingService,
  ) {}

  @Get('active/current')
  getActiveBarrel() {
    return this.barrelsService.getActiveBarrel();
  }

  @Get('deleted')
  findDeleted() {
    return this.barrelsService.findDeleted();
  }

  @Post('cleanup')
  cleanup(@CurrentUser() user?: { id: string }) {
    this.loggingService.logSystemOperationTriggered(
      'BARRELS_CLEANUP',
      user?.id,
    );
    return this.barrelsService.cleanup();
  }

  @Get()
  findAll(
    @Query('withDeleted', new DefaultValuePipe(false), ParseBoolPipe)
    withDeleted: boolean,
  ): Promise<Barrel[]> {
    return this.barrelsService.findAll(withDeleted);
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
