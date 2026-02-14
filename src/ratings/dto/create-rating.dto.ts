import { IsNumber, Min, Max, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({ description: 'ID of the user', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @ApiProperty({ description: 'ID of the book to rate', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  book_id: number;

  @ApiProperty({ description: 'Rating value between 1 and 5', example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Review text', example: 'Excellent book!' })
  @IsString()
  @IsOptional()
  review?: string;
}
