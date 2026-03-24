import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Property } from '../properties/entities/property.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
  ) {}

  async create(userId: string, createReviewDto: CreateReviewDto) {
    if (createReviewDto.propertyId) {
      const property = await this.propertyRepository.findOne({
        where: { id: createReviewDto.propertyId },
      });

      if (!property) {
        throw new NotFoundException('Property not found');
      }
    }

    const review = this.reviewsRepository.create({
      ...createReviewDto,
      userId,
    });

    return this.reviewsRepository.save(review);
  }

  async findAllByProperty(propertyId: string) {
    return this.reviewsRepository.find({
      where: { propertyId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(userId: string, id: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.reviewsRepository.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    Object.assign(review, updateReviewDto);
    return this.reviewsRepository.save(review);
  }

  async remove(userId: string, id: string) {
    const review = await this.reviewsRepository.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews'); // Or check if admin
    }

    return this.reviewsRepository.remove(review);
  }
}
