import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch, Delete } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a new message' })
  async sendMessage(
    @Request() req,
    @Body('receiverId') receiverId: string,
    @Body('content') content: string,
  ) {
    return this.messagesService.sendMessage(req.user.id, receiverId, content);
  }

  @Get('inbox')
  @ApiOperation({ summary: 'Get quick summary of all active conversations' })
  async getInbox(@Request() req) {
    return this.messagesService.getInboxSummary(req.user.id);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get entire chat history with a specific user' })
  async getChatHistory(@Request() req, @Param('userId') otherUserId: string) {
    // Optionally mark them as read when fetching history
    await this.messagesService.markAsRead(otherUserId, req.user.id);
    return this.messagesService.getChatHistory(req.user.id, otherUserId);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all messages as read' })
  async markAllRead(@Request() req) {
    return this.messagesService.markAllAsRead(req.user.id);
  }

  @Delete('clear-all')
  @ApiOperation({ summary: 'Clear all messages' })
  async clearAll(@Request() req) {
    return this.messagesService.clearAllMessages(req.user.id);
  }
}
