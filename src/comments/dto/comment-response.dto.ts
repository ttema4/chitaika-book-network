import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { BookResponseDto } from '../../books/dto/book-response.dto';

export class CommentResponseDto {
  @ApiProperty({ description: 'The unique identifier of the comment', example: 1 })
  id: number;

  @ApiProperty({ description: 'Content of the comment' })
  content: string;

  @ApiProperty({ description: 'Start offset' })
  start_offset: number;

  @ApiProperty({ description: 'End offset' })
  end_offset: number;

  @ApiProperty({ description: 'Creation date' })
  created_at: Date;

  @ApiProperty({ description: 'User ID' })
  user_id: number;

  @ApiProperty({ type: () => UserResponseDto, description: 'User who created the comment' })
  user: UserResponseDto;

  @ApiProperty({ description: 'Book ID' })
  book_id: number;

  @ApiProperty({ type: () => BookResponseDto, description: 'Book related to the comment' })
  book: BookResponseDto;
}
