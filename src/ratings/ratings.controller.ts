import { Controller, Post, Body, Get, Param, UseInterceptors, UseGuards, Req } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { CacheControl } from '../common/decorators/cache-control.decorator';
import { RatingsService } from './ratings.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(AuthGuard)
  setRating(@Body() body: { bookId: number; rating: number; review?: string }, @Req() req: any) {
    const userId = req.user.id;
    return this.ratingsService.setRating(userId, body.bookId, body.rating, body.review);
  }

  @Get('book/:bookId')
  @UseInterceptors(CacheInterceptor)
  @CacheControl('public, max-age=60')
  findByBook(@Param('bookId') bookId: string) {
    return this.ratingsService.findByBook(+bookId);
  }

  @UseInterceptors(CacheInterceptor)
  @CacheControl('public, max-age=60')
  @Get('book/:bookId/average')
  getAverage(@Param('bookId') bookId: string) {
      return this.ratingsService.getAverageRating(+bookId);
  }
}
