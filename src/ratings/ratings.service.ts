import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './entities/rating.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private ratingsRepository: Repository<Rating>,
  ) {}

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

  async getAverageRating(bookId: number): Promise<number> {
    const { avg } = await this.ratingsRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.rating)', 'avg')
      .where('rating.book_id = :bookId', { bookId })
      .getRawOne();
    return parseFloat(avg) || 0;
  }
}
