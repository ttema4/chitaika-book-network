import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { BookResponseDto } from '../../books/dto/book-response.dto';

export class RatingResponseDto {
  @ApiProperty({ description: 'The unique identifier of the rating', example: 1 })
  id: number;

  @ApiProperty({ description: 'Rating value' })
  rating: number;

  @ApiProperty({ description: 'Review text', required: false })
  review?: string;

  @ApiProperty({ description: 'User ID' })
  user_id: number;

  @ApiProperty({ type: () => UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ description: 'Book ID' })
  book_id: number;

  @ApiProperty({ type: () => BookResponseDto })
  book: BookResponseDto;
}
