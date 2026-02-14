import { Controller, Get, Post, Body, Delete, Param, Query, UseGuards, Req, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { CacheControl } from '../common/decorators/cache-control.decorator';
import { FavoritesService } from './favorites.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
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
  @UseInterceptors(CacheInterceptor)
  @CacheControl('public, max-age=60')
  findAll(@Param('userId') userId: string) {
    return this.favoritesService.findAllByUser(+userId);
  }
  @UseInterceptors(CacheInterceptor)
  @CacheControl('private, max-age=0, no-cache')
  
  @Get('check/:userId/:bookId')
  check(@Param('userId') userId: string, @Param('bookId') bookId: string) {
      return this.favoritesService.isFavorite(+userId, +bookId);
  }
}
