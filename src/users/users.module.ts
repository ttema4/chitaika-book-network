import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersApiController } from './users.api.controller';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { FilesModule } from '../files/files.module';
import { FavoritesModule } from '../favorites/favorites.module';
import { UserBooksModule } from '../user-books/user-books.module';
import { CommentsModule } from '../comments/comments.module';
import { BooksModule } from '../books/books.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    FilesModule,
    forwardRef(() => FavoritesModule),
    forwardRef(() => UserBooksModule),
    forwardRef(() => CommentsModule),
    forwardRef(() => BooksModule),
  ],
  controllers: [UsersController, UsersApiController],
  providers: [UsersService, UsersResolver],
  exports: [UsersService],
})
export class UsersModule {}
