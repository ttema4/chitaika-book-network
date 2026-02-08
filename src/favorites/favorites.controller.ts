import { Controller, Get, Post, Body, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @UseGuards(AuthGuard)
  add(@Req() req: any, @Body() body: { bookId: number }) {
    return this.favoritesService.add(req.user.id, body.bookId);
  }

  @Delete()
  @UseGuards(AuthGuard)
  remove(@Req() req: any, @Body() body: { bookId: number }) {
    return this.favoritesService.remove(req.user.id, body.bookId);
  }

  @Get(':userId')
  findAll(@Param('userId') userId: string) {
    return this.favoritesService.findAllByUser(+userId);
  }
  
  @Get('check/:userId/:bookId')
  check(@Param('userId') userId: string, @Param('bookId') bookId: string) {
      return this.favoritesService.isFavorite(+userId, +bookId);
  }
}
