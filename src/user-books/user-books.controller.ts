import { Controller, Post, Body, Param, UseGuards, Req, Get, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { CacheControl } from '../common/decorators/cache-control.decorator';
import { UserBooksService } from './user-books.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserBookStatus } from './entities/user-book.entity';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
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
@UseInterceptors(CacheInterceptor)
  @CacheControl('public, max-age=60')
  
  @Get('latest-reading')
  async getLatestReading() {
      return this.userBooksService.findLatestReading();
  }
}
