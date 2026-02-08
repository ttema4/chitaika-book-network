import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { RatingsService } from './ratings.service';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  setRating(@Body() body: { userId: number; bookId: number; rating: number; review?: string }) {
    return this.ratingsService.setRating(body.userId, body.bookId, body.rating, body.review);
  }

  @Get('book/:bookId')
  findByBook(@Param('bookId') bookId: string) {
    return this.ratingsService.findByBook(+bookId);
  }

  @Get('book/:bookId/average')
  getAverage(@Param('bookId') bookId: string) {
      return this.ratingsService.getAverageRating(+bookId);
  }
}
