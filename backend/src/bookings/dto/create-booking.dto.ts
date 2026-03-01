import { IsString, IsNumber, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
    @ApiProperty()
    @IsString()
    propertyId: string;

    @ApiProperty()
    @IsString()
    guestId: string;

    @ApiProperty()
    @IsDateString()
    startDate: string;

    @ApiProperty()
    @IsDateString()
    endDate: string;

    @ApiProperty()
    @IsNumber()
    totalPrice: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsEnum(['pending', 'confirmed', 'cancelled', 'completed'])
    status?: string;
}
