import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketMessage } from './entities/ticket.entity';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketMessage)
    private messageRepository: Repository<TicketMessage>,
  ) {}

  async findAll() {
    return this.ticketRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['user', 'messages', 'messages.sender'],
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async create(userId: string, data: { summary: string; category: string }) {
    const ticket = this.ticketRepository.create({
      ...data,
      userId,
    });
    return this.ticketRepository.save(ticket);
  }

  async addMessage(ticketId: string, senderId: string, content: string) {
    const message = this.messageRepository.create({
      ticketId,
      senderId,
      content,
    });
    return this.messageRepository.save(message);
  }

  async updateStatus(id: string, status: string) {
    const result = await this.ticketRepository.update(id, { status });
    if (result.affected === 0) {
      throw new NotFoundException(`Ticket with id ${id} not found`);
    }
    return { success: true, id, status };
  }
}
