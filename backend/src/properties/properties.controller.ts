import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFiles, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
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
    @UseInterceptors(AnyFilesInterceptor({
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
            },
        }),
    }))
    uploadMedia(@UploadedFiles() files: Array<Express.Multer.File>) {
        return files.map(file => ({
            url: `/uploads/${file.filename}`,
            type: file.mimetype.startsWith('video') ? 'video' : 'image',
            originalname: file.originalname
        }));
    }

    @Post()
    create(@Body() createPropertyDto: CreatePropertyDto) {
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
    update(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto) {
        return this.propertiesService.update(id, updatePropertyDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
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
