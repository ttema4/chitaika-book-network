import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavoriteDto {
  @ApiProperty({ description: 'ID of the user', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @ApiProperty({ description: 'ID of the book to add to favorites', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  book_id: number;
}
