import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { parse } from 'pg-connection-string';
import { User } from './users/entities/user.entity';
import { Book } from './books/entities/book.entity';
import { Comment } from './comments/entities/comment.entity';
import { Favorite } from './favorites/entities/favorite.entity';
import { Rating } from './ratings/entities/rating.entity';
import { InitialSchema1707320000000 } from './migrations/1707320000000-InitialSchema';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not defined');
    }
    
    // Parse the connection string
    const config = parse(databaseUrl);

    return {
      type: 'postgres',
      host: config.host!,
      port: Number(config.port) || 5432,
      username: config.user!,
      password: config.password!,
      database: config.database!,
      // Load entities explicitly or via glob. Explicit is often safer for bundlers.
      entities: [User, Book, Comment, Favorite, Rating], 
      // Synchronize should be false in production, we use migrations
      synchronize: false, 
      // Load migrations
      migrations: [InitialSchema1707320000000],
      // Run migrations automatically on application start
      migrationsRun: true,
      logging: true,
    };
  }
}
