import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { CommentsService } from './comments.service';
import { Comment } from './models/comment.model';
import { CreateCommentInput } from './dto/create-comment.input';
import { User } from '../users/models/user.model';
import { UsersService } from '../users/users.service';
import { Book } from '../books/models/book.model';
import { BooksService } from '../books/books.service';

@Resolver(() => Comment)
export class CommentsResolver {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly usersService: UsersService,
    private readonly booksService: BooksService,
  ) {}

  @Query(() => [Comment])
  async comments(
      @Args('skip', { type: () => Int, nullable: true }) skip: number = 0,
      @Args('take', { type: () => Int, nullable: true }) take: number = 25,
  ) {
    const [comments] = await this.commentsService.findAllWithPagination(skip, take);
    return comments;
  }

  @Query(() => Comment, { nullable: true })
  async comment(@Args('id', { type: () => Int }) id: number) {
    return this.commentsService.findOne(id);
  }

  @Mutation(() => Comment)
  async createComment(@Args('createCommentInput') createCommentInput: CreateCommentInput) {
    return this.commentsService.create(createCommentInput);
  }

  @Mutation(() => Boolean)
  async removeComment(@Args('id', { type: () => Int }) id: number) {
    await this.commentsService.remove(id);
    return true;
  }

  @ResolveField(() => User, { nullable: true })
  async user(@Parent() comment: Comment) {
    if (comment.user) {
        return comment.user;
    }
    return this.usersService.findOne(comment.user_id);
  }

  @ResolveField(() => Book, { nullable: true })
  async book(@Parent() comment: Comment) {
    if (comment.book) {
        return comment.book;
    }
    return this.booksService.findOne(comment.book_id);
  }
}
