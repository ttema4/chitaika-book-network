import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserBook } from './entities/user-book.entity';
import { UserBooksService } from './user-books.service';
import { UserBooksController } from './user-books.controller';
import { User } from '../users/entities/user.entity';
import { Book } from '../books/entities/book.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserBook, User, Book])],
  controllers: [UserBooksController],
  providers: [UserBooksService],
  exports: [UserBooksService],
})
export class UserBooksModule {}
