import { Controller, Get, Render, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { BooksService } from './books/books.service';
import { FavoritesService } from './favorites/favorites.service';
import { UserBooksService } from './user-books/user-books.service';
import type { Request } from 'express';

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
    let books = await this.booksService.findAll();
    const readingNow = await this.userBooksService.findLatestReading();
    
    // @ts-ignore
    if (req.user) {
        // @ts-ignore
        const userFavorites = await this.favoritesService.findAllByUser(req.user.id);
        const favIds = new Set(userFavorites.map(f => f.book.id));
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
        friendId: ub.user.id
    }));

    const popularBooks = await this.booksService.findMostPopular(4);

    return {
      readingNow,
      newBooks,
      friendsBooks,
      weeklyPicks: popularBooks
    };
  }

  @Get('about')
  @Render('pages/about')
  about() {
    return {};
  }


  @Get('friends-reads')
  @Render('users/friends-reads')
  async friendsReads() {
    const reads = await this.userBooksService.findLatestReading(); 
    
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
        date: ub.updatedAt
    }));

    return {
      friendsReads
    };
  }

  /*
  @Get('profile')
  @Render('profile')
  profile() {
    return {};
  }
  */
}
