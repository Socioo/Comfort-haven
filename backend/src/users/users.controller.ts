import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors, UploadedFile, Req, UnauthorizedException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/constants';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.FINANCE, UserRole.SUPPORT)
    findAll(@Query('role') role?: string) {
        if (role) {
            const normalizedRole = role.toLowerCase().endsWith('s') ? role.slice(0, -1) : role;
            if (['user', 'host', 'super-admin', 'manager', 'finance', 'support'].includes(normalizedRole)) {
                return this.usersService.findAllByRole(normalizedRole);
            }
        }
        return this.usersService.findAll();
    }

    @Post()
    @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
    create(@Body() createUserDto: any) {
        return this.usersService.create(createUserDto);
    }

    @Get(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.FINANCE, UserRole.SUPPORT)
    findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Patch(':id/status')
    @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
    async updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.usersService.update(id, { status } as any);
    }

    @Patch(':id/profile')
    async updateProfile(
        @Req() req: any,
        @Param('id') id: string, 
        @Body() updateData: { name?: string; email?: string; phone?: string; role?: UserRole; message?: string }
    ) {
        // Only allow if it's their own profile or they are admin
        if (req.user.role !== UserRole.SUPER_ADMIN && req.user.id !== id) {
            throw new UnauthorizedException('You can only update your own profile');
        }

        // Sanitize data to only include valid User entity properties
        const { name, email, phone, role } = updateData;
        const sanitizedData: any = {};
        if (name) sanitizedData.name = name;
        if (email) sanitizedData.email = email;
        if (phone) sanitizedData.phone = phone;

        // If Super Admin, allow role changes
        if (req.user.role === UserRole.SUPER_ADMIN && role) {
            sanitizedData.role = role;
        }

        return this.usersService.update(id, sanitizedData);
    }

    @Patch(':id/notifications')
    async updateNotifications(
        @Param('id') id: string,
        @Body() notifications: { newUsers: boolean; newProperties: boolean; newBookings: boolean; marketing: boolean }
    ) {
        return this.usersService.update(id, { notifications } as any);
    }

    @Patch(':id/appearance')
    async updateAppearance(
        @Param('id') id: string,
        @Body() appearance: { theme: string; language: string }
    ) {
        return this.usersService.update(id, { appearance } as any);
    }

    @Patch(':id/password')
    async updatePassword(
        @Req() req: any,
        @Param('id') id: string, 
        @Body() updateData: any
    ) {
        if (req.user.id !== id) {
            throw new UnauthorizedException('You can only update your own password');
        }
        return this.usersService.updatePassword(id, updateData);
    }

    @Post(':id/profile-image')
    @UseInterceptors(FileInterceptor('file', {
        storage: new CloudinaryStorage({
            cloudinary: cloudinary,
            params: {
                folder: 'comfort-haven/users',
                allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            } as any,
        })
    }))
    async uploadProfileImage(
        @Req() req: any,
        @Param('id') id: string, 
        @UploadedFile(new FileValidationPipe({
            maxSize: 2 * 1024 * 1024, // 2MB for profile pics
            allowedMimes: ['image/jpeg', 'image/png', 'image/webp']
        })) file: any
    ) {
        if (req.user.id !== id && req.user.role !== UserRole.SUPER_ADMIN) {
            throw new UnauthorizedException('You can only update your own profile image');
        }
        const profileImagePath = file.path; // Cloudinary returns the full URL in file.path
        return this.usersService.update(id, { profileImage: profileImagePath });
    }

    @Patch(':id/admin-reset-password')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    async adminResetPassword(@Param('id') id: string, @Body('newPassword') newPassword: string) {
        return this.usersService.adminResetPassword(id, newPassword);
    }

    @Patch(':id/verify')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
    async verify(@Param('id') id: string) {
        return this.usersService.adminVerify(id);
    }

    @Delete('profile')
    @UseGuards(JwtAuthGuard)
    async deleteProfile(@Req() req: any) {
        // Authenticated user deleting their own account
        return this.usersService.remove(req.user.id);
    }

    @Patch('profile/deactivate')
    @UseGuards(JwtAuthGuard)
    async deactivateProfile(@Req() req: any) {
        // Authenticated user deactivating their own account
        return this.usersService.update(req.user.id, { status: 'inactive' } as any);
    }

    @Patch('profile/reactivate')
    @UseGuards(JwtAuthGuard)
    async reactivateProfile(@Req() req: any) {
        // Authenticated user reactivating their own account
        return this.usersService.update(req.user.id, { status: 'active' } as any);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    async remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
