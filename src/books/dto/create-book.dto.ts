import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({ description: 'The title of the book', example: 'War and Peace' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'The author of the book', example: 'Leo Tolstoy' })
  @IsString()
  @IsNotEmpty()
  author: string;

  @ApiPropertyOptional({ description: 'The genre of the book', example: 'Novel' })
  @IsString()
  @IsOptional()
  genre?: string;

  @ApiPropertyOptional({ description: 'Description of the book' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'URL to the cover image' })
  @IsString()
  @IsOptional()
  cover_url?: string;

  @ApiPropertyOptional({ description: 'URL to the text file' })
  @IsString()
  @IsOptional()
  text_url?: string;
}
