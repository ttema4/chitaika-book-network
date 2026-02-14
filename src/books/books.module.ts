import { Module, forwardRef } from '@nestjs/common';
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
import { UsersModule } from '../users/users.module';
import { RatingsModule } from '../ratings/ratings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book]),
    FilesModule,
    forwardRef(() => FavoritesModule),
    forwardRef(() => UserBooksModule),
    forwardRef(() => CommentsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => RatingsModule),
  ],
  controllers: [BooksController, BooksApiController],
  providers: [BooksService, BooksResolver],
  exports: [BooksService],
})
export class BooksModule {}
