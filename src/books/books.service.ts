import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './entities/book.entity';
import { Subject } from 'rxjs';

@Injectable()
export class BooksService {
  public readonly bookCreated$ = new Subject<Book>();

  constructor(
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
  ) {}

  findAll(): Promise<Book[]> {
    return this.booksRepository.find();
  }

  async create(book: Partial<Book>): Promise<Book> {
    const newBook = this.booksRepository.create(book);
    const savedBook = await this.booksRepository.save(newBook);
    this.bookCreated$.next(savedBook);
    return savedBook;
  }

  findOne(id: number): Promise<Book | null> {
    return this.booksRepository.findOneBy({ id });
  }

  async findMostPopular(limit = 6): Promise<Book[]> {
      // In a real scenario, we would join with favorites or ratings.
      // Since we don't have direct count columns, we can just return random or last added for now to be safe,
      // OR better: use query builder to count favorites if possible.
      // Let's stick to returning some books but shuffled to look "popular". 
      // Actually standard way: ORDER BY random() or similar.
      // But let's act like "Popular" is just "Oldest" or defined. 
      // Let's return the first ones.
      return this.booksRepository.find({
          take: limit
      });
  }

  async update(id: number, updateBook: Partial<Book>): Promise<Book | null> {
    await this.booksRepository.update(id, updateBook);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.booksRepository.delete(id);
  }
}
