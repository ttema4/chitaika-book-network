import { Controller, Post, Body, Get, Param, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { CacheControl } from '../common/decorators/cache-control.decorator';
import { RatingsService } from './ratings.service';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  setRating(@Body() body: { userId: number; bookId: number; rating: number; review?: string }) {
    return this.ratingsService.setRating(body.userId, body.bookId, body.rating, body.review);
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
