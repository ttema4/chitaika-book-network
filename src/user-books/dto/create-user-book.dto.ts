import { IsNumber, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserBookStatus } from '../entities/user-book.entity';

export class CreateUserBookDto {
  @ApiProperty({ description: 'ID of the user', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: 'ID of the book', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  bookId: number;

  @ApiProperty({ description: 'Status of the book for the user', enum: UserBookStatus, example: UserBookStatus.PLANNED })
  @IsEnum(UserBookStatus)
  @IsNotEmpty()
  status: UserBookStatus;
}
