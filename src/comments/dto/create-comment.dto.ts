import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'The content of the comment', example: 'Great book!' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Start offset of the comment in the text', example: 0 })
  @IsNumber()
  start_offset: number;

  @ApiProperty({ description: 'End offset of the comment in the text', example: 100 })
  @IsNumber()
  end_offset: number;

  @ApiProperty({ description: 'ID of the user who made the comment', example: 1 })
  @IsNumber()
  user_id: number;

  @ApiProperty({ description: 'ID of the book being commented on', example: 1 })
  @IsNumber()
  book_id: number;
}
