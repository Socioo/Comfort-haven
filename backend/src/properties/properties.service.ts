import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
    constructor(
        @InjectRepository(Property)
        private propertiesRepository: Repository<Property>,
    ) { }

    create(createPropertyDto: CreatePropertyDto) {
        const property = this.propertiesRepository.create(createPropertyDto);
        return this.propertiesRepository.save(property);
    }

    findAll(status?: string) {
        const where = status ? { status } : {};
        return this.propertiesRepository.find({ where, relations: ['owner'] });
    }

    findOne(id: string) {
        return this.propertiesRepository.findOne({ where: { id }, relations: ['owner', 'bookings'] });
    }

    update(id: string, updatePropertyDto: UpdatePropertyDto) {
        return this.propertiesRepository.update(id, updatePropertyDto);
    }

    remove(id: string) {
        return this.propertiesRepository.delete(id);
    }
}
