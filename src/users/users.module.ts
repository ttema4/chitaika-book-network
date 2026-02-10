import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { FilesModule } from '../files/files.module';
import { FavoritesModule } from '../favorites/favorites.module';
import { UserBooksModule } from '../user-books/user-books.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    FilesModule,
    FavoritesModule,
    UserBooksModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
