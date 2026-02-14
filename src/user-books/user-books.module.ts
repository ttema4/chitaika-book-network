import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserBook } from './entities/user-book.entity';
import { UserBooksService } from './user-books.service';
import { UserBooksController } from './user-books.controller';
import { UserBooksApiController } from './user-books.api.controller';
import { UserBooksResolver } from './user-books.resolver';
import { User } from '../users/entities/user.entity';
import { Book } from '../books/entities/book.entity';
import { UsersModule } from '../users/users.module';
import { BooksModule } from '../books/books.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserBook, User, Book]),
    forwardRef(() => UsersModule),
    forwardRef(() => BooksModule),
  ],
  controllers: [UserBooksController, UserBooksApiController],
  providers: [UserBooksService, UserBooksResolver],
  exports: [UserBooksService],
})
export class UserBooksModule {}
