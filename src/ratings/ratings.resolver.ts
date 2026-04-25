import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent, Context } from '@nestjs/graphql';
import { RatingsService } from './ratings.service';
import { Rating } from './models/rating.model';
import { CreateRatingInput } from './dto/create-rating.input';
import { User } from '../users/models/user.model';
import { UsersService } from '../users/users.service';
import { Book } from '../books/models/book.model';
import { BooksService } from '../books/books.service';
import { UseGuards, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

@Resolver(() => Rating)
export class RatingsResolver {
  constructor(
    private readonly ratingsService: RatingsService,
    private readonly usersService: UsersService,
    private readonly booksService: BooksService,
  ) {}

  @Query(() => [Rating])
  async ratings(
      @Args('skip', { type: () => Int, nullable: true }) skip: number = 0,
      @Args('take', { type: () => Int, nullable: true }) take: number = 25,
  ) {
    const [ratings] = await this.ratingsService.findAll(skip, take);
    return ratings;
  }

  @Query(() => Rating, { nullable: true })
  async rating(@Args('id', { type: () => Int }) id: number) {
    return this.ratingsService.findOne(id);
  }

  @Mutation(() => Rating)
  @UseGuards(AuthGuard)
  async createRating(
      @Args('createRatingInput') createRatingInput: CreateRatingInput,
      @Context() context: any,
  ) {
    const userId = context.req.user.id;
    return this.ratingsService.setRating(
        userId, 
        createRatingInput.book_id, 
        createRatingInput.rating, 
        createRatingInput.review
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async removeRating(@Args('id', { type: () => Int }) id: number, @Context() context: any) {
    const rating = await this.ratingsService.findOne(id);
    if (!rating) {
        throw new NotFoundException('Rating not found');
    }
    
    const user = context.req.user;
    if (rating.user_id !== user.id && user.role !== 'admin') {
        throw new ForbiddenException('You can only delete your own ratings');
    }

    await this.ratingsService.remove(id);
    return true;
  }

  @ResolveField(() => User, { nullable: true })
  async user(@Parent() rating: Rating) {
    if (rating.user) {
        return rating.user;
    }
    return this.usersService.findOne(rating.user_id);
  }

  @ResolveField(() => Book, { nullable: true })
  async book(@Parent() rating: Rating) {
    if (rating.book) {
        return rating.book;
    }
    return this.booksService.findOne(rating.book_id);
  }
}
