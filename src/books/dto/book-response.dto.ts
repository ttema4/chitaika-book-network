import { ApiProperty } from '@nestjs/swagger';

export class BookResponseDto {
  @ApiProperty({ description: 'The unique identifier of the book', example: 1 })
  id: number;

  @ApiProperty({ description: 'The title of the book', example: 'War and Peace' })
  title: string;

  @ApiProperty({ description: 'The author of the book', example: 'Leo Tolstoy' })
  author: string;

  @ApiProperty({ description: 'The genre of the book', example: 'Novel', required: false })
  genre?: string;

  @ApiProperty({ description: 'Description of the book', example: 'Detailed history...', required: false })
  description?: string;

  @ApiProperty({ description: 'URL to the cover image', required: false })
  cover_url?: string;

  @ApiProperty({ description: 'URL to the text file', required: false })
  text_url?: string;
}
