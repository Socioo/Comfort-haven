import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faq } from './entities/faq.entity';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Injectable()
export class FaqsService {
  constructor(
    @InjectRepository(Faq)
    private faqsRepository: Repository<Faq>,
  ) {}

  create(createFaqDto: CreateFaqDto) {
    const faq = this.faqsRepository.create(createFaqDto);
    return this.faqsRepository.save(faq);
  }

  findAll() {
    return this.faqsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const faq = await this.faqsRepository.findOneBy({ id });
    if (!faq) {
      throw new NotFoundException(`Faq with ID ${id} not found`);
    }
    return faq;
  }

  async update(id: string, updateFaqDto: UpdateFaqDto) {
    const faq = await this.findOne(id);
    this.faqsRepository.merge(faq, updateFaqDto);
    return this.faqsRepository.save(faq);
  }

  async remove(id: string) {
    const faq = await this.findOne(id);
    return this.faqsRepository.remove(faq);
  }
}
