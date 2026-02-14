import { IsString, IsNotEmpty, IsOptional, IsEmail, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'The unique username of the user', example: 'johndoe' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'The email of the user', example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'The SuperTokens ID', example: 'st-id-123' })
  @IsString()
  @IsOptional()
  supertokens_id?: string;

  @ApiPropertyOptional({ description: 'URL to the avatar image' })
  @IsString()
  @IsOptional()
  avatar_url?: string;
}
