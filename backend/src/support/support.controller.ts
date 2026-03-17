import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  findAll() {
    return this.supportService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supportService.findOne(id);
  }

  @Post()
  create(@Req() req, @Body() body: { summary: string; category: string }) {
    return this.supportService.create(req.user.id, body);
  }

  @Post(':id/messages')
  addMessage(@Req() req, @Param('id') id: string, @Body() body: { content: string }) {
    return this.supportService.addMessage(id, req.user.id, body.content);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.supportService.updateStatus(id, body.status);
  }
}
