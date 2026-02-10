import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { parse } from 'pg-connection-string';
import { User } from './users/entities/user.entity';
import { Book } from './books/entities/book.entity';
import { Comment } from './comments/entities/comment.entity';
import { Favorite } from './favorites/entities/favorite.entity';
import { Rating } from './ratings/entities/rating.entity';
import { UserBook } from './user-books/entities/user-book.entity';
import { InitialSchema1000000000000 } from './migrations/1000000000000-InitialSchema';
import { CreateUserBooks1000000000001 } from './migrations/1000000000001-CreateUserBooks';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not defined');
    }
    
    const config = parse(databaseUrl);

    return {
      type: 'postgres',
      host: config.host!,
      port: Number(config.port) || 5432,
      username: config.user!,
      password: config.password!,
      database: config.database!,
      entities: [User, Book, Comment, Favorite, Rating, UserBook], 
      synchronize: false,
      migrationsRun: true, 
      migrations: [
        InitialSchema1000000000000,
        CreateUserBooks1000000000001
      ],
      logging: true,
    };
  }
}
