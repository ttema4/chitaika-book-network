import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from './entities/rating.entity';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { RatingsApiController } from './ratings.api.controller';
import { RatingsResolver } from './ratings.resolver';
import { UsersModule } from '../users/users.module';
import { BooksModule } from '../books/books.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rating]),
    forwardRef(() => UsersModule),
    forwardRef(() => BooksModule),
  ],
  controllers: [RatingsController, RatingsApiController],
  providers: [RatingsService, RatingsResolver],
  exports: [RatingsService],
})
export class RatingsModule {}
