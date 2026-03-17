import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PropertiesService {
    constructor(
        @InjectRepository(Property)
        private propertiesRepository: Repository<Property>,
        private notificationsService: NotificationsService,
    ) { }

    async create(createPropertyDto: CreatePropertyDto) {
        const property = this.propertiesRepository.create(createPropertyDto);
        const savedProperty = await this.propertiesRepository.save(property);
        
        // Notify admins about new property submission
        try {
            await this.notificationsService.notifyAdmins({
                type: 'info',
                title: 'New Property Submission',
                message: `A new property "${savedProperty.title}" has been submitted for approval.`,
                metadata: { propertyId: savedProperty.id }
            });
        } catch (e) {
            console.error('Failed to send notification', e);
        }

        return savedProperty;
    }

    findAll(status?: string) {
        const where = status ? { status } : {};
        return this.propertiesRepository.find({ where, relations: ['owner', 'reviews'] });
    }

    findOne(id: string) {
        return this.propertiesRepository.findOne({ where: { id }, relations: ['owner', 'bookings', 'reviews'] });
    }

    update(id: string, updatePropertyDto: UpdatePropertyDto) {
        return this.propertiesRepository.update(id, updatePropertyDto);
    }

    remove(id: string) {
        return this.propertiesRepository.delete(id);
    }

    async findByHost(hostId: string) {
        return this.propertiesRepository.find({ where: { ownerId: hostId }, relations: ['reviews'] });
    }

    async search(query: any) {
        // Basic search implementation
        // For production, use QueryBuilder for more complex queries (ranges, partial matches)
        return this.propertiesRepository.find({ where: query });
    }
}
