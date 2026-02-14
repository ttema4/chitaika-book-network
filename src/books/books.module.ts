import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { BooksController } from './books.controller';
import { BooksApiController } from './books.api.controller';
import { BooksService } from './books.service';
import { BooksResolver } from './books.resolver';
import { FilesModule } from '../files/files.module';
import { FavoritesModule } from '../favorites/favorites.module';
import { UserBooksModule } from '../user-books/user-books.module';
import { CommentsModule } from '../comments/comments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book]),
    FilesModule,
    FavoritesModule,
    UserBooksModule,
    CommentsModule
  ],
  controllers: [BooksController, BooksApiController],
  providers: [BooksService, BooksResolver],
  exports: [BooksService],
})
export class BooksModule {}
