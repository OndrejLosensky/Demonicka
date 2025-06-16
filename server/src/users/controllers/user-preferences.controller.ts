import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Post,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../entities/user.entity';
import { UserPreferencesService } from '../user-preferences.service';
import { UpdateUserPreferencesDto } from '../dto/update-user-preferences.dto';
import { DeviceTokenService } from '../../auth/device-token.service';
import { Versions } from '../../versioning/decorators/version.decorator';
import { RegisterDeviceDto } from '../dto/register-device.dto';

@Controller('api/v1/users/preferences')
@UseGuards(JwtAuthGuard)
@Versions('1')
export class UserPreferencesController {
  constructor(
    private readonly preferencesService: UserPreferencesService,
    @Inject(forwardRef(() => DeviceTokenService))
    private readonly deviceTokenService: DeviceTokenService,
  ) {}

  @Get()
  async getPreferences(@GetUser() user: User) {
    return this.preferencesService.findByUserId(user.id);
  }

  @Put()
  async updatePreferences(
    @GetUser() user: User,
    @Body() updateDto: UpdateUserPreferencesDto,
  ) {
    return this.preferencesService.update(user.id, updateDto);
  }

  @Post('device')
  async registerDevice(
    @GetUser() user: User,
    @Body() deviceInfo: RegisterDeviceDto,
  ) {
    return this.deviceTokenService.createOrUpdateToken(user, deviceInfo.token, {
      deviceType: deviceInfo.deviceType,
      deviceName: deviceInfo.deviceName,
      deviceModel: deviceInfo.deviceModel,
      osVersion: deviceInfo.osVersion,
    });
  }
} 