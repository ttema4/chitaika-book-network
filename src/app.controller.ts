import { Controller, Get, Post, Body, Render, UseInterceptors, UploadedFiles, Res, Param, Patch, Delete, Sse, MessageEvent, UseGuards, Req, Query, DefaultValuePipe, NotFoundException } from '@nestjs/common';
import { CacheControl } from './common/decorators/cache-control.decorator';
import { AppService } from './app.service';
import { BooksService } from './books/books.service';
import { FavoritesService } from './favorites/favorites.service';
import { UserBooksService } from './user-books/user-books.service';
import type { Request } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly booksService: BooksService,
    private readonly favoritesService: FavoritesService,
    private readonly userBooksService: UserBooksService,
  ) {}

  @Get()
  @Render('pages/index')
  async root(@Req() req: Request) {
    const [fetchedBooks] = await this.booksService.findAll(0, 100);
    let books: any[] = fetchedBooks;
    const readingNow = await this.userBooksService.findLatestReading();
    
    let favIds = new Set<number>();
    const currentUser = (req as any).user;
    
    if (currentUser) {
        const userFavorites = await this.favoritesService.findAllByUser(currentUser.id);
        favIds = new Set(userFavorites.map(f => f.book.id));
        books = books.map(b => ({
            ...b,
            isFavorite: favIds.has(b.id)
        }));
    }

    const newBooks = books.slice(-6).reverse();

    const friendsBooks = readingNow.map(ub => ({
        id: ub.book.id,
        title: ub.book.title,
        author: ub.book.author,
        coverUrl: ub.book.cover_url,
        genre: ub.book.genre,
        description: ub.book.description,
        friendName: ub.user.username,
        friendId: ub.user.id,
        isFavorite: favIds.has(ub.book.id)
    }));

    const popularBooksRaw = await this.booksService.findMostPopular(4);
    const popularBooks = popularBooksRaw.map(b => ({
        ...b,
        isFavorite: favIds.has(b.id)
    }));

    return {
      readingNow,
      newBooks,
      friendsBooks,
      weeklyPicks: popularBooks,
      isAuthenticated: !!currentUser
    };
  }

  @Get('about')
  @CacheControl('public, max-age=3600')
  @Render('pages/about')
  about() {
    return {};
  }


  @Get('friends-reads')
  @Render('users/friends-reads')
  async friendsReads(@Req() req: Request) {
    const reads = await this.userBooksService.findLatestReading(); 
    
    let favIds = new Set<number>();
    const currentUser = (req as any).user;
    if (currentUser) {
        const userFavorites = await this.favoritesService.findAllByUser(currentUser.id);
        favIds = new Set(userFavorites.map(f => f.book.id));
    }

    const friendsReads = reads.map(ub => ({
        id: ub.book.id,
        title: ub.book.title,
        author: ub.book.author,
        coverUrl: ub.book.cover_url,
        genre: ub.book.genre,
        description: ub.book.description,
        friendName: ub.user.username,
        friendId: ub.user.id,
        status: ub.status,
        date: ub.updatedAt,
        isFavorite: favIds.has(ub.book.id)
    }));

    return {
      friendsReads,
      isAuthenticated: !!currentUser
    };
  }
}
