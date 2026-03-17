import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payout, Refund } from './entities/finance.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Payout)
    private payoutRepository: Repository<Payout>,
    @InjectRepository(Refund)
    private refundRepository: Repository<Refund>,
  ) {}

  async findAllPayouts() {
    return this.payoutRepository.find({
      relations: ['booking', 'booking.property'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllRefunds() {
    return this.refundRepository.find({
      relations: ['booking', 'booking.guest'],
      order: { createdAt: 'DESC' },
    });
  }

  async createRefund(data: { bookingId: string; amount: number; reason: string }) {
    const refund = this.refundRepository.create(data);
    return this.refundRepository.save(refund);
  }

  async updatePayoutStatus(id: string, status: string) {
    await this.payoutRepository.update(id, { status });
    return this.payoutRepository.findOne({ where: { id } });
  }

  async updateRefundStatus(id: string, status: string) {
    await this.refundRepository.update(id, { status });
    return this.refundRepository.findOne({ where: { id } });
  }
}
