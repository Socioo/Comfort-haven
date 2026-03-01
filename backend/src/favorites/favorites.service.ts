import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { Property } from '../properties/entities/property.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
  ) {}

  async findAll(userId: string) {
    return this.favoritesRepository.find({
      where: { userId },
      relations: ['property'],
    });
  }

  async addLoop(userId: string, propertyId: string) {
    const property = await this.propertyRepository.findOne({ where: { id: propertyId } });
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const existingFavorite = await this.favoritesRepository.findOne({
      where: { userId, propertyId },
    });

    if (existingFavorite) {
      throw new ConflictException('Property already in favorites');
    }

    const favorite = this.favoritesRepository.create({
      userId,
      propertyId,
    });

    return this.favoritesRepository.save(favorite);
  }

  async remove(userId: string, propertyId: string) {
    const favorite = await this.favoritesRepository.findOne({
      where: { userId, propertyId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    return this.favoritesRepository.remove(favorite);
  }

  async check(userId: string, propertyId: string) {
    const favorite = await this.favoritesRepository.findOne({
      where: { userId, propertyId },
    });
    return { isFavorite: !!favorite };
  }
}
