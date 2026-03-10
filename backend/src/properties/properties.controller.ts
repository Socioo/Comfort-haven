import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
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
    findAll(@Query('status') status?: string) {
        return this.propertiesService.findAll(status);
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
    search(@Body() query: any) {
        return this.propertiesService.search(query);
    }
}
