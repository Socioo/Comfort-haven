import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/constants';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('banks')
  @UseGuards(JwtAuthGuard)
  // Override roles to allow HOSTs to access
  @Roles(UserRole.HOST, UserRole.SUPER_ADMIN, UserRole.FINANCE)
  getBanks() {
    return this.financeService.getBanks();
  }

  @Post('verify-account')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HOST)
  verifyAccount(@Body() body: { accountNumber: string; bankCode: string }) {
    return this.financeService.verifyAccount(body.accountNumber, body.bankCode);
  }

  @Post('create-subaccount')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HOST)
  createSubaccount(
    @Req() req: any,
    @Body() body: { bankCode: string; accountNumber: string; bankName: string; accountName: string },
  ) {
    return this.financeService.createHostSubaccount(req.user.id, {
      ...body,
      email: req.user.email,
    });
  }

  @Get('payouts')
  findAllPayouts() {
    return this.financeService.findAllPayouts();
  }

  @Get('refunds')
  findAllRefunds() {
    return this.financeService.findAllRefunds();
  }

  @Post('refunds')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN, UserRole.FINANCE)
  createRefund(@Body() data: { bookingId: string; amount: number; reason: string }) {
    return this.financeService.createRefund(data);
  }

  @Patch('payouts/:id')
  updatePayoutStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.financeService.updatePayoutStatus(id, body.status);
  }

  @Patch('refunds/:id')
  updateRefundStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.financeService.updateRefundStatus(id, body.status);
  }
}
