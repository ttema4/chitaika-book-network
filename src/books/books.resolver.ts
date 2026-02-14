import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { BooksService } from './books.service';
import { Book } from './models/book.model';
import { CreateBookInput } from './dto/create-book.input';
import { CommentsService } from '../comments/comments.service';
import { Comment } from '../comments/models/comment.model';

@Resolver(() => Book)
export class BooksResolver {
  constructor(
      private readonly booksService: BooksService,
      private readonly commentsService: CommentsService  
  ) {}

  @Query(() => [Book])
  async books(
      @Args('skip', { type: () => Int, nullable: true }) skip: number = 0,
      @Args('take', { type: () => Int, nullable: true }) take: number = 25,
  ) {
    const [books] = await this.booksService.findAll(skip, take);
    return books;
  }

  @Query(() => Book, { nullable: true })
  async book(@Args('id', { type: () => Int }) id: number) {
    return this.booksService.findOne(id);
  }

  @ResolveField(() => [Comment])
  async comments(@Parent() book: Book) {
      return this.commentsService.findAll(book.id);
  }

  @Mutation(() => Book)
  async createBook(@Args('createBookInput') createBookInput: CreateBookInput) {
    return this.booksService.create({
        ...createBookInput,
        cover_url: createBookInput.cover_url || null,
        text_url: createBookInput.text_url || ''
    });
  }
}
