import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payout, Refund } from './entities/finance.entity';
import { User } from '../users/entities/user.entity';
import axios from 'axios';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Payout)
    private payoutRepository: Repository<Payout>,
    @InjectRepository(Refund)
    private refundRepository: Repository<Refund>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private get paystackSecret(): string {
    return process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_key_here';
  }

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

  async getBanks() {
    try {
      const response = await axios.get(`${PAYSTACK_BASE_URL}/bank`, {
        headers: { Authorization: `Bearer ${this.paystackSecret}` },
      });
      return response.data;
    } catch (error: any) {
      console.error('Paystack getBanks Error:', error.response?.data || error.message);
      throw new InternalServerErrorException(`Failed to fetch banks: ${error.response?.data?.message || error.message}`);
    }
  }

  async verifyAccount(accountNumber: string, bankCode: string) {
    try {
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        { headers: { Authorization: `Bearer ${this.paystackSecret}` } },
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Paystack verifyAccount Error:', {
        message: errorMessage,
        data: error.response?.data,
        status: error.response?.status,
      });

      // Special handling for Paystack Test Mode limits
      if (errorMessage.includes('daily limit of 3 live bank resolves exceeded')) {
        throw new BadRequestException(
          'Paystack Test Limit: You have exceeded the 3 daily live bank resolves allowed in test mode. ' +
          'Please use Bank Code "001" (Test Bank) with any 10-digit account number to continue testing.'
        );
      }

      throw new BadRequestException(`Failed to verify account: ${errorMessage}`);
    }
  }

  async createHostSubaccount(userId: string, data: { bankCode: string; accountNumber: string; bankName: string; accountName: string; email: string }) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!data.bankCode || !data.accountNumber) {
      throw new BadRequestException('Bank code and account number are required');
    }

    try {
      // business_name must be unique on Paystack. 
      // Using name + short ID to ensure uniqueness.
      const businessName = `${user.name} (${user.id.split('-')[0]})`.substring(0, 100);

      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/subaccount`,
        {
          business_name: businessName,
          settlement_bank: data.bankCode,
          account_number: data.accountNumber,
          percentage_charge: 10,
          description: `Payout account for ${user.email}`,
          primary_contact_email: data.email,
          primary_contact_name: user.name,
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecret}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const subaccountCode = response.data.data.subaccount_code;

      // Update user with banking details
      await this.userRepository.update(userId, {
        bankName: data.bankName,
        bankCode: data.bankCode,
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        paystackSubaccountCode: subaccountCode,
      });

      return { success: true, subaccountCode };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      const statusCode = error.response?.status || 500;
      
      console.error('Paystack Subaccount Error:', {
        message: errorMessage,
        data: error.response?.data,
        status: statusCode,
      });

      if (statusCode === 400 || statusCode === 422) {
        throw new BadRequestException(`Paystack error: ${errorMessage}`);
      }
      throw new InternalServerErrorException(`Paystack error: ${errorMessage}`);
    }
  }
}
