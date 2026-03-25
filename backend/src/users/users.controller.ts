import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/constants';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
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
    create(@Body() createUserDto: any) {
        // In a real scenario, this would have a guard and handle password hashing
        return this.usersService.create(createUserDto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Patch(':id/status')
    async updateStatus(@Param('id') id: string, @Body('status') status: string) {
        // Assuming status is stored in User entity
        return this.usersService.update(id, { status } as any);
    }

    @Patch(':id/profile')
    async updateProfile(@Param('id') id: string, @Body() updateData: { name?: string; email?: string; phone?: string }) {
        return this.usersService.update(id, updateData);
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
    async updatePassword(@Param('id') id: string, @Body() updateData: any) {
        return this.usersService.updatePassword(id, updateData);
    }

    @Post(':id/profile-image')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/users',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    async uploadProfileImage(@Param('id') id: string, @UploadedFile() file: any) {
        const profileImagePath = `/uploads/users/${file.filename}`;
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

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    async remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
