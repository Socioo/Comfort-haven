import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class CreateFaqDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsEnum(['guest', 'host', 'both'])
  @IsOptional()
  targetAudience?: 'guest' | 'host' | 'both';
}
