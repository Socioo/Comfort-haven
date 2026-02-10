import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
    constructor(private readonly propertiesService: PropertiesService) { }

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
}
