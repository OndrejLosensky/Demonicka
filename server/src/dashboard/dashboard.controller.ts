import { Controller, Get, UseGuards, Header } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @Header('Cache-Control', 'public, max-age=30')
  async getDashboardStats(): Promise<DashboardResponseDto> {
    return this.dashboardService.getDashboardStats();
  }
}
