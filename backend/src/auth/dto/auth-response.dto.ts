import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/constants';

class UserResponse {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  phone?: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  profileImage?: string;

  @ApiProperty({ example: false })
  isVerified: boolean;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT Access Token' })
  accessToken: string;

  @ApiProperty({ type: UserResponse })
  user: UserResponse;
}