import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
  ) {}

  async create(createCommentDto: any): Promise<Comment> {
    const comment = this.commentsRepository.create(createCommentDto as Partial<Comment>);
    const saved = await this.commentsRepository.save(comment);
    return this.findOne(saved.id);
  }

  async findAll(bookId?: number): Promise<Comment[]> {
    if (bookId) {
        return this.commentsRepository.find({ 
            where: { book_id: bookId },
            relations: ['user']
        });
    }
    return this.commentsRepository.find({ relations: ['user', 'book'] });
  }

  async findAllByUser(userId: number): Promise<Comment[]> {
    return this.commentsRepository.find({ 
        where: { user_id: userId },
        relations: ['book']
    });
  }

  async findAllWithPagination(skip: number = 0, take: number = 10): Promise<[Comment[], number]> {
      return this.commentsRepository.findAndCount({
          skip,
          take,
          relations: ['user', 'book']
      });
  }

  async findOne(id: number): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({ 
        where: { id },
        relations: ['user', 'book']
    });
    if (!comment) {
      throw new NotFoundException(`Comment #${id} not found`);
    }
    return comment;
  }

  async remove(id: number): Promise<void> {
    const comment = await this.findOne(id);
    await this.commentsRepository.remove(comment);
  }
}
