import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    findAll(@Query('role') role?: string) {
        if (role) {
            // Normalize role to singular if plural is passed (e.g. 'users' -> 'user')
            const normalizedRole = role.toLowerCase().endsWith('s') ? role.slice(0, -1) : role;
            
            if (['user', 'host', 'admin'].includes(normalizedRole)) {
                return this.usersService.findAllByRole(normalizedRole as 'user' | 'host');
            }
        }
        return this.usersService.findAll();
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
}
