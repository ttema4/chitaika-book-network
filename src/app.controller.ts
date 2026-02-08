import { Controller, Get, Render, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { BooksService } from './books/books.service';
import { FavoritesService } from './favorites/favorites.service';
import type { Request } from 'express';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly booksService: BooksService,
    private readonly favoritesService: FavoritesService,
  ) {}

  @Get()
  @Render('pages/index')
  async root(@Req() req: Request) {
    let books = await this.booksService.findAll();
    
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

    return {
      newBooks,
      friendsBooks: [
        { id: 7, title: 'Летний архив', author: 'И. Память', cover_url: 'https://storage.yandexcloud.net/book-network/images/cover.png', genre: 'Современная проза', description: 'Небольшой город, тёплое лето и находка.', friendName: 'Аня П.', friendId: 1 },
        { id: 8, title: 'Прах и звёзды', author: 'Р. Космосов', cover_url: 'https://storage.yandexcloud.net/book-network/images/cover.png', genre: 'Научная фантастика', description: 'Экспедиция к далёкой туманности.', friendName: 'Дима К.', friendId: 2 },
        { id: 9, title: 'Тихие улицы', author: 'М. Городская', cover_url: 'https://storage.yandexcloud.net/book-network/images/cover.png', genre: 'Роман', description: 'Истории соседей, которые мы обычно не замечаем.', friendName: 'Марина С.', friendId: 3 },
        { id: 3, title: 'Город без алиби', author: 'В. Следователь', cover_url: 'https://storage.yandexcloud.net/book-network/images/cover.png', genre: 'Детектив', description: 'Ночной мегаполис, одно преступление.', friendName: 'Олег В.', friendId: 4 },
      ],
      weeklyPicks: [
        { id: 10, title: 'Мастер и Маргарита', author: 'М.А. Булгаков', cover_url: 'https://storage.yandexcloud.net/book-network/images/cover.png', genre: 'Мистика', description: 'Классика, которую должен прочитать каждый.' },
        { id: 11, title: '1984', author: 'Дж. Оруэлл', cover_url: 'https://storage.yandexcloud.net/book-network/images/cover.png', genre: 'Антиутопия', description: 'Классика антиутопического жанра.' },
        { id: 12, title: 'Убийство в Восточном экспрессе', author: 'А. Кристи', cover_url: 'https://storage.yandexcloud.net/book-network/images/cover.png', genre: 'Детектив', description: 'Один из самых известных романов Агаты Кристи.' },
      ]
    };
  }

  @Get('about')
  @Render('pages/about')
  about() {
    return {};
  }


  @Get('friends-reads')
  @Render('users/friends-reads')
  friendsReads() {
    return {
      friendsReads: [
        { id: 7, title: 'Летний архив', author: 'И. Память', coverUrl: 'https://storage.yandexcloud.net/book-network/images/cover.png', genre: 'Современная проза', description: 'Небольшой город, тёплое лето и находка.', friendName: 'Аня П.', friendId: 1 },
        { id: 8, title: 'Прах и звёзды', author: 'Р. Космосов', coverUrl: 'https://storage.yandexcloud.net/book-network/images/cover.png', genre: 'Научная фантастика', description: 'Экспедиция к далёкой туманности.', friendName: 'Дима К.', friendId: 2 },
        { id: 9, title: 'Тихие улицы', author: 'М. Городская', coverUrl: 'https://storage.yandexcloud.net/book-network/images/cover.png', genre: 'Роман', description: 'Истории соседей, которые мы обычно не замечаем.', friendName: 'Марина С.', friendId: 3 },
        { id: 3, title: 'Город без алиби', author: 'В. Следователь', coverUrl: 'https://storage.yandexcloud.net/book-network/images/cover.png', genre: 'Детектив', description: 'Ночной мегаполис, одно преступление.', friendName: 'Олег В.', friendId: 4 },
      ]
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
