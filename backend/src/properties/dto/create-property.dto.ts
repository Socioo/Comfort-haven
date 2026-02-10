import { IsString, IsNumber, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePropertyDto {
    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsString()
    description: string;

    @ApiProperty()
    @IsNumber()
    price: number;

    @ApiProperty()
    @IsString()
    location: string;

    @ApiProperty()
    @IsString()
    ownerId: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsEnum(['active', 'pending', 'suspended', 'rejected'])
    status?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    images?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    amenities?: string[];
}
