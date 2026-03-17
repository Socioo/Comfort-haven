import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payout, Refund } from './entities/finance.entity';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Payout, Refund])],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
