import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async sendMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
    const receiver = await this.usersRepository.findOne({ where: { id: receiverId } });
    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    const message = this.messagesRepository.create({
      senderId,
      receiverId,
      content,
    });

    return this.messagesRepository.save(message);
  }

  async getChatHistory(userId1: string, userId2: string): Promise<Message[]> {
    return this.messagesRepository.find({
      where: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ],
      order: { createdAt: 'ASC' },
      relations: ['sender', 'receiver'],
    });
  }

  async getInboxSummary(userId: string): Promise<any[]> {
    // Get all distinct users the current user has chatted with
    const messages = await this.messagesRepository.find({
      where: [
        { senderId: userId },
        { receiverId: userId }
      ],
      order: { createdAt: 'DESC' },
      relations: ['sender', 'receiver'],
    });

    const conversationsMap = new Map();

    messages.forEach((msg) => {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          user: {
            id: otherUser.id,
            name: otherUser.name,
            profileImage: otherUser.profileImage,
          },
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: msg.receiverId === userId && !msg.isRead ? 1 : 0
        });
      } else {
        const conv = conversationsMap.get(otherUserId);
        if (msg.receiverId === userId && !msg.isRead) {
          conv.unreadCount += 1;
        }
      }
    });

    return Array.from(conversationsMap.values());
  }

  async markAsRead(senderId: string, receiverId: string): Promise<void> {
    await this.messagesRepository.update(
      { senderId, receiverId, isRead: false },
      { isRead: true }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.messagesRepository.update(
      { receiverId: userId, isRead: false },
      { isRead: true }
    );
  }

  async clearAllMessages(userId: string): Promise<void> {
    await this.messagesRepository.delete([
      { senderId: userId },
      { receiverId: userId }
    ]);
  }
}
