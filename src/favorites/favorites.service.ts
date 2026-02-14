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
    if (!favorite) {
        throw new NotFoundException('Favorite not found');
    }
    await this.favoritesRepository.remove(favorite);
  }

  async findAllByUser(userId: number): Promise<Favorite[]> {
    return this.favoritesRepository.find({
        where: { user_id: userId },
        relations: ['book']
    });
  }

  async findAllByBook(bookId: number): Promise<Favorite[]> {
    return this.favoritesRepository.find({
        where: { book_id: bookId },
        relations: ['user']
    });
  }

  async findOne(id: number): Promise<Favorite | null> {
      return this.favoritesRepository.findOne({
          where: { id },
          relations: ['book', 'user']
      });
  }

  async findAllWithPagination(skip: number = 0, take: number = 10): Promise<[Favorite[], number]> {
      return this.favoritesRepository.findAndCount({
          skip,
          take,
          relations: ['book', 'user']
      });
  }

  async isFavorite(userId: number, bookId: number): Promise<boolean> {
     const count = await this.favoritesRepository.countBy({ user_id: userId, book_id: bookId });
     return count > 0;
  }
}
