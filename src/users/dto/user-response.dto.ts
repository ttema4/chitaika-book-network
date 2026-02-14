import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'The unique identifier of the user', example: 1 })
  id: number;

  @ApiProperty({ description: 'The username', example: 'johndoe' })
  username: string;

  @ApiProperty({ description: 'The email address', example: 'john@example.com' })
  email: string;

  @ApiProperty({ description: 'Avatar URL', required: false })
  avatar_url?: string;

  @ApiProperty({ description: 'Number of books read', example: 5 })
  booksReadCount: number;

  @ApiProperty({ description: 'User role', example: 'user' })
  role: string;

  @ApiProperty({ description: 'Friends of the user', type: [UserResponseDto], required: false })
  friends?: UserResponseDto[];
}
