import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/constants';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // Public - no auth required
  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  // Public - no auth required (used by mobile app to fetch contact/social info separately)
  @Get('group/:groupName')
  findByGroup(@Param('groupName') groupName: string) {
    return this.settingsService.findByGroup(groupName);
  }

  // Public - no auth required
  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.settingsService.findOneByKey(key);
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateMany(@Body() body: { settings: { key: string; value: string }[] }) {
    return this.settingsService.updateMany(body.settings);
  }

  @Patch(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('key') key: string, @Body() body: { value: string }) {
    return this.settingsService.updateByKey(key, body.value);
  }
}
