import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
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

  @Get('payouts')
  findAllPayouts() {
    return this.financeService.findAllPayouts();
  }

  @Get('refunds')
  findAllRefunds() {
    return this.financeService.findAllRefunds();
  }

  @Post('refunds')
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
