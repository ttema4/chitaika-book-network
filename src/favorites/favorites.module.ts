import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './entities/favorite.entity';
import { FavoritesController } from './favorites.controller';
import { FavoritesApiController } from './favorites.api.controller';
import { FavoritesService } from './favorites.service';
import { FavoritesResolver } from './favorites.resolver';
import { UsersModule } from '../users/users.module';
import { BooksModule } from '../books/books.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Favorite]),
    forwardRef(() => UsersModule),
    forwardRef(() => BooksModule),
  ],
  controllers: [FavoritesController, FavoritesApiController],
  providers: [FavoritesService, FavoritesResolver],
  exports: [FavoritesService],
})
export class FavoritesModule {}
