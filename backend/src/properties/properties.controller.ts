import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFiles, UseGuards, Req, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UserRole } from '../common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
    constructor(private readonly propertiesService: PropertiesService) { }

    @Post('upload')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(AnyFilesInterceptor({
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
            },
        }),
    }))
    uploadMedia(
        @UploadedFiles(new FileValidationPipe({
            maxSize: 10 * 1024 * 1024, // 10MB
            allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
        })) files: Array<Express.Multer.File>
    ) {
        return files.map(file => ({
            url: `/uploads/${file.filename}`,
            type: file.mimetype.startsWith('video') ? 'video' : 'image',
            originalname: file.originalname
        }));
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Req() req: any, @Body() createPropertyDto: CreatePropertyDto) {
        // Automatically set the owner to the current user
        createPropertyDto.ownerId = req.user.id;
        return this.propertiesService.create(createPropertyDto);
    }

    @Get()
    @UseGuards(OptionalJwtAuthGuard)
    findAll(
        @Query('status') status?: string,
        @Query('showAll') showAll?: string,
        @Req() req?: any
    ) {
        return this.propertiesService.findAll(status, req?.user, showAll === 'true');
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.propertiesService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    async update(
        @Req() req: any,
        @Param('id') id: string, 
        @Body() updatePropertyDto: UpdatePropertyDto
    ) {
        const property = await this.propertiesService.findOne(id);
        if (!property) throw new NotFoundException('Property not found');
        
        // Only owner or admin can update
        if (property.ownerId !== req.user.id && req.user.role !== UserRole.SUPER_ADMIN) {
            throw new UnauthorizedException('You do not own this property');
        }
        
        return this.propertiesService.update(id, updatePropertyDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async remove(@Req() req: any, @Param('id') id: string) {
        const property = await this.propertiesService.findOne(id);
        if (!property) throw new NotFoundException('Property not found');

        // Only owner or admin can delete
        if (property.ownerId !== req.user.id && req.user.role !== UserRole.SUPER_ADMIN) {
            throw new UnauthorizedException('You do not own this property');
        }

        return this.propertiesService.remove(id);
    }

    @Get('host/:hostId')
    findByHost(@Param('hostId') hostId: string) {
        return this.propertiesService.findByHost(hostId);
    }

    @Post('search')
    @UseGuards(OptionalJwtAuthGuard)
    search(
        @Body() query: any,
        @Query('showAll') showAll?: string,
        @Req() req?: any
    ) {
        return this.propertiesService.search(query, req?.user, showAll === 'true');
    }

    @Post(':id/initialize-listing-payment')
    @UseGuards(JwtAuthGuard)
    initializeListingPayment(@Param('id') id: string, @Req() req: any) {
        return this.propertiesService.initializeListingPayment(id, req.user.email);
    }

    @Get('verify-listing-payment/:reference')
    @UseGuards(JwtAuthGuard)
    verifyListingPayment(@Param('reference') reference: string) {
        return this.propertiesService.verifyListingPayment(reference);
    }
}
