import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmConfigService } from './typeorm-config.service';
import { RatingsModule } from './ratings/ratings.module';
import { BooksModule } from './books/books.module';
import { UsersModule } from './users/users.module';
import { CommentsModule } from './comments/comments.module';
import { FavoritesModule } from './favorites/favorites.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import { AuthMiddleware } from './auth/auth.middleware';
import { SupertokensMiddleware } from './auth/supertokens.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    RatingsModule,
    BooksModule,
    UsersModule,
    CommentsModule,
    FavoritesModule,
    FilesModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    TypeOrmConfigService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SupertokensMiddleware)
      .forRoutes('*');
      
    consumer
      .apply(AuthMiddleware)
      .forRoutes('*');
  }
}
