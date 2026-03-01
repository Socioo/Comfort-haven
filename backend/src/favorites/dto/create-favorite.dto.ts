import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavoriteDto {
  @ApiProperty({ description: 'The ID of the property to favorite' })
  @IsNotEmpty()
  @IsUUID()
  propertyId: string;
}
