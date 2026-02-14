import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { RatingsService } from './ratings.service';
import { Rating } from './models/rating.model';
import { CreateRatingInput } from './dto/create-rating.input';
import { User } from '../users/models/user.model';
import { UsersService } from '../users/users.service';
import { Book } from '../books/models/book.model';
import { BooksService } from '../books/books.service';

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
  async createRating(@Args('createRatingInput') createRatingInput: CreateRatingInput) {
    return this.ratingsService.create(createRatingInput);
  }

  @Mutation(() => Boolean)
  async removeRating(@Args('id', { type: () => Int }) id: number) {
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
