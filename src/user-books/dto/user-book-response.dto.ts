import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { BookResponseDto } from '../../books/dto/book-response.dto';
import { UserBookStatus } from '../entities/user-book.entity';

export class UserBookResponseDto {
  @ApiProperty({ description: 'The unique identifier', example: 1 })
  id: number;

  @ApiProperty({ description: 'User ID' })
  userId: number;

  @ApiProperty({ type: () => UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ description: 'Book ID' })
  bookId: number;

  @ApiProperty({ type: () => BookResponseDto })
  book: BookResponseDto;

  @ApiProperty({ description: 'Status', enum: UserBookStatus })
  status: UserBookStatus;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}
