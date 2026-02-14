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

  async findAll(skip: number = 0, take: number = 10): Promise<[Book[], number]> {
    return this.booksRepository.findAndCount({
      skip,
      take,
    });
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
