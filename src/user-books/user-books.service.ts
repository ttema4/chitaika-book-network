import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBook, UserBookStatus } from './entities/user-book.entity';
import { User } from '../users/entities/user.entity';
import { Book } from '../books/entities/book.entity';

@Injectable()
export class UserBooksService {
  constructor(
    @InjectRepository(UserBook)
    private readonly userBookRepository: Repository<UserBook>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  async findOne(userId: number, bookId: number): Promise<UserBook | null> {
    return this.userBookRepository.findOne({
      where: { userId, bookId },
    });
  }

  async updateStatus(userId: number, bookId: number, status: UserBookStatus): Promise<UserBook> {
    let userBook = await this.userBookRepository.findOne({
      where: { userId, bookId },
    });

    if (!userBook) {
      userBook = this.userBookRepository.create({
        userId,
        bookId,
        status,
      });
    } else {
      userBook.status = status;
    }

    const saved = await this.userBookRepository.save(userBook);
    
    // Update user's booksReadCount if status is READ
    if (status === UserBookStatus.READ) {
       // logic to increment count? Or just count dynamically
       // The user entity has a count column. We might want to update it.
       // But efficient way is just count distinct books with status READ.
       const count = await this.userBookRepository.count({ where: { userId, status: UserBookStatus.READ } });
       await this.userRepository.update(userId, { booksReadCount: count });
    }

    return saved;
  }

  async findAllByStatus(status: UserBookStatus) {
    return this.userBookRepository.find({
      where: { status },
      relations: ['user', 'book'],
      order: { updatedAt: 'DESC' },
      take: 20
    });
  }
  
  async findLatestReading() {
     return this.userBookRepository.find({
         where: { status: UserBookStatus.READING },
         relations: ['user', 'book'],
         order: { updatedAt: 'DESC' },
         take: 10
     });
  }

  async findAllByUser(userId: number) {
    return this.userBookRepository.find({
      where: { userId },
      relations: ['book'],
      order: { updatedAt: 'DESC' }
    });
  }
}
