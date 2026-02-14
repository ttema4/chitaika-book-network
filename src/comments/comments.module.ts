import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { CommentsController } from './comments.controller';
import { CommentsApiController } from './comments.api.controller';
import { CommentsService } from './comments.service';
import { CommentsResolver } from './comments.resolver';
import { UsersModule } from '../users/users.module';
import { BooksModule } from '../books/books.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    forwardRef(() => UsersModule),
    forwardRef(() => BooksModule),
  ],
  controllers: [CommentsController, CommentsApiController],
  providers: [CommentsService, CommentsResolver],
  exports: [CommentsService],
})
export class CommentsModule {}
