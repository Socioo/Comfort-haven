import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Delete } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.notificationsService.findAll(req.user.id);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    return { count: await this.notificationsService.getUnreadCount(req.user.id) };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('read-all')
  async markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete('clear-all')
  async clearAll(@Request() req) {
    return this.notificationsService.deleteAll(req.user.id);
  }
}
