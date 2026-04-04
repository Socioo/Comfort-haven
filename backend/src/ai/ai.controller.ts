import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async chat(@Req() req, @Body() body: { messages: any[] }) {
    const userRole = req.user?.role || 'guest';
    const userName = req.user?.firstName || 'User';
    
    return this.aiService.generateChatResponse(body.messages, userRole, userName);
  }
}
