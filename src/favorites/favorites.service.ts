import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
  ) {}

  async add(userId: number, bookId: number): Promise<Favorite> {
    const existing = await this.favoritesRepository.findOneBy({ user_id: userId, book_id: bookId });
    if (existing) {
        throw new ConflictException('Book is already in favorites');
    }
    const favorite = this.favoritesRepository.create({ user_id: userId, book_id: bookId });
    return this.favoritesRepository.save(favorite);
  }

  async remove(userId: number, bookId: number): Promise<void> {
    const favorite = await this.favoritesRepository.findOneBy({ user_id: userId, book_id: bookId });
    if (favorite) {
        await this.favoritesRepository.remove(favorite);
    }
  }

  async findAllByUser(userId: number): Promise<Favorite[]> {
    return this.favoritesRepository.find({
        where: { user_id: userId },
        relations: ['book']
    });
  }

  async isFavorite(userId: number, bookId: number): Promise<boolean> {
     const count = await this.favoritesRepository.countBy({ user_id: userId, book_id: bookId });
     return count > 0;
  }
}
