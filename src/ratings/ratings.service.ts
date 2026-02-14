import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './entities/rating.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private ratingsRepository: Repository<Rating>,
  ) {}

  async create(createRatingInput: any): Promise<Rating> {
      // Logic for create vs setRating? 
      // Reuse setRating if possible or implement direct create
      // setRating handles upsert.
      return this.setRating(createRatingInput.user_id, createRatingInput.book_id, createRatingInput.rating, createRatingInput.review);
  }

  async setRating(userId: number, bookId: number, value: number, review?: string): Promise<Rating> {
    let rating = await this.ratingsRepository.findOneBy({ user_id: userId, book_id: bookId });
    if (rating) {
      rating.rating = value;
      if (review !== undefined) rating.review = review;
    } else {
      rating = this.ratingsRepository.create({
        user_id: userId,
        book_id: bookId,
        rating: value,
        review: review
      });
    }
    return this.ratingsRepository.save(rating);
  }

  async findByBook(bookId: number): Promise<Rating[]> {
    return this.ratingsRepository.find({ where: { book_id: bookId }, relations: ['user'] });
  }

  async findAll(skip: number = 0, take: number = 25): Promise<[Rating[], number]> {
        return this.ratingsRepository.findAndCount({
            skip,
            take,
            relations: ['user', 'book']
        });
  }

  async findByUser(userId: number): Promise<Rating[]> {
    return this.ratingsRepository.find({ where: { user_id: userId }, relations: ['book'] });
  }

  async getAverageRating(bookId: number): Promise<number> {
    const { avg } = await this.ratingsRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.rating)', 'avg')
      .where('rating.book_id = :bookId', { bookId })
      .getRawOne();
    return parseFloat(avg) || 0;
  }

  async findAllWithPagination(skip: number = 0, take: number = 10): Promise<[Rating[], number]> {
      return this.ratingsRepository.findAndCount({
          skip,
          take,
          relations: ['user', 'book']
      });
  }

  async findOne(id: number): Promise<Rating | null> {
      return this.ratingsRepository.findOne({ 
          where: { id },
          relations: ['user', 'book']
      });
  }

  async remove(id: number): Promise<void> {
      const rating = await this.findOne(id);
      if (!rating) {
          throw new NotFoundException(`Rating with ID ${id} not found`);
      }
      await this.ratingsRepository.delete(id);
  }
}
