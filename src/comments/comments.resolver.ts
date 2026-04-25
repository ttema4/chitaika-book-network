import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent, Context } from '@nestjs/graphql';
import { CommentsService } from './comments.service';
import { Comment } from './models/comment.model';
import { CreateCommentInput } from './dto/create-comment.input';
import { User } from '../users/models/user.model';
import { UsersService } from '../users/users.service';
import { Book } from '../books/models/book.model';
import { BooksService } from '../books/books.service';
import { UseGuards, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

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
  @UseGuards(AuthGuard)
  async createComment(
      @Args('createCommentInput') createCommentInput: CreateCommentInput,
      @Context() context: any,
  ) {
    const userId = context.req.user.id;
    return this.commentsService.create({ ...createCommentInput, user_id: userId });
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async removeComment(@Args('id', { type: () => Int }) id: number, @Context() context: any) {
    const comment = await this.commentsService.findOne(id);
    if (!comment) {
        throw new NotFoundException('Comment not found');
    }

    const user = context.req.user;
    if (comment.user.id !== user.id && user.role !== 'admin') {
        throw new ForbiddenException('You can only delete your own comments');
    }

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

