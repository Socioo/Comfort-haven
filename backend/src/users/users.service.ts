import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { UnauthorizedException } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { UserRole } from '../common/constants';
import * as crypto from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private mailService: MailService,
    private notificationsService: NotificationsService,
  ) { }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(createUserDto: any): Promise<User> {
    console.log('UsersService.create received:', createUserDto);
    createUserDto.email = createUserDto.email.toLowerCase().trim();
    const isInvitation = createUserDto.role === UserRole.ADMIN || createUserDto.role === UserRole.SUB_ADMIN;
    console.log('isInvitation detected:', isInvitation);
    let password = createUserDto.password;

    if (isInvitation && !password) {
      // Generate a random password for invitations
      password = crypto.randomBytes(8).toString('hex');
      console.log('Generated random password for invitation:', password);
    }

    const hashedPassword = await bcrypt.hash(password || 'Password123!', 10);
    console.log(`Debug: Hashing password for ${createUserDto.email}. Length: ${password?.length || 12}. Hash starts with: ${hashedPassword.substring(0, 10)}`);
    
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      mustChangePassword: isInvitation,
    });

    const savedUser = await this.usersRepository.save(user as any);
    console.log('User saved successfully:', savedUser.id);

    // Notify admins about new user registration
    try {
        await this.notificationsService.notifyAdmins({
            type: 'success',
            title: `New ${savedUser.role} Joined`,
            message: `${savedUser.name} has just registered as a ${savedUser.role}.`,
            metadata: { userId: savedUser.id }
        });
    } catch (e) {
        console.error('Failed to send registration notification', e);
    }

    if (isInvitation) {
      console.log('Triggering invitation email for:', savedUser.email);
      // Send invitation email
      await this.mailService.sendInvitationEmail(
        savedUser.email, 
        savedUser.name, 
        password,
        createUserDto.message
      );
    }

    return savedUser as any;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    await this.usersRepository.update(id, updateData);
    return this.findById(id);
  }

  async updatePassword(id: string, updateData: any): Promise<User | null> {
    console.log(`Attempting password update for user: ${id}`);
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'password', 'mustChangePassword'],
    });

    if (!user) {
      console.error(`Password update failed: User ${id} not found`);
      throw new UnauthorizedException('User not found');
    }

    const { currentPassword, newPassword } = updateData;

    console.log('Comparing current password...');
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      console.warn(`Password update failed: Invalid current password for user ${id}`);
      throw new UnauthorizedException('Invalid current password. Please check your current password and try again.');
    }

    console.log('Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.update(id, { 
      password: hashedPassword,
      mustChangePassword: false 
    });

    console.log(`Password updated successfully for user ${id}`);
    return this.findById(id);
  }

  async adminResetPassword(id: string, newPassword: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.update(id, { 
      password: hashedPassword,
      mustChangePassword: true
    });

    return this.findById(id);
  }

  async adminVerify(id: string): Promise<User | null> {
    console.log(`Attempting to verify user: ${id}`);
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      console.error(`User not found for verification: ${id}`);
      throw new UnauthorizedException('User not found');
    }
    console.log(`User found. Current status: ${user.status}, Role: ${user.role}. Updating to verified/active.`);
    await this.usersRepository.update(id, { isVerified: true, status: 'active' });
    const updatedUser = await this.findById(id);
    console.log(`User ${id} verified successfully.`);
    return updatedUser;
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findAllByRole(role: string): Promise<User[]> {
    return this.usersRepository.find({ 
      where: { role: role as any },
      relations: ['properties']
    });
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}