import { Controller, Post, Body, Param, UseGuards, Req, Get } from '@nestjs/common';
import { UserBooksService } from './user-books.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserBookStatus } from './entities/user-book.entity';

@Controller('user-books')
export class UserBooksController {
  constructor(private readonly userBooksService: UserBooksService) {}

  @Post(':bookId/status')
  @UseGuards(AuthGuard)
  async updateStatus(
    @Param('bookId') bookId: string,
    @Body('status') status: UserBookStatus,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.userBooksService.updateStatus(userId, +bookId, status);
  }

  @Get('latest-reading')
  async getLatestReading() {
      return this.userBooksService.findLatestReading();
  }
}
