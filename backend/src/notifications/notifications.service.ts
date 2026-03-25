import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userId: string, data: { type: string; title: string; message: string; metadata?: any }) {
    const notification = this.notificationsRepository.create({
      userId,
      ...data,
    });
    return this.notificationsRepository.save(notification);
  }

  async findAll(userId: string) {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getUnreadCount(userId: string) {
    return this.notificationsRepository.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string) {
    return this.notificationsRepository.update(id, { isRead: true });
  }

  async markAllAsRead(userId: string) {
    return this.notificationsRepository.update({ userId, isRead: false }, { isRead: true });
  }

  async deleteAll(userId: string) {
    return this.notificationsRepository.delete({ userId });
  }

  async notifyAdmins(data: { type: string; title: string; message: string; metadata?: any }) {
    const admins = await this.usersRepository.find({
      where: [
        { role: 'admin' as any },
        { role: 'sub-admin' as any }
      ]
    });

    const notifications = admins.map(admin => 
      this.notificationsRepository.create({
        userId: admin.id,
        ...data
      })
    );

    return this.notificationsRepository.save(notifications);
  }
}
