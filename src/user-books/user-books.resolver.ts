import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UserBooksService } from './user-books.service';
import { UserBook } from './models/user-book.model';
import { CreateUserBookInput } from './dto/create-user-book.input';
import { User } from '../users/models/user.model';
import { UsersService } from '../users/users.service';
import { Book } from '../books/models/book.model';
import { BooksService } from '../books/books.service';

@Resolver(() => UserBook)
export class UserBooksResolver {
  constructor(
    private readonly userBooksService: UserBooksService,
    private readonly usersService: UsersService,
    private readonly booksService: BooksService,
  ) {}

  @Query(() => [UserBook])
  async userBooks(
      @Args('skip', { type: () => Int, nullable: true }) skip: number = 0,
      @Args('take', { type: () => Int, nullable: true }) take: number = 25,
  ) {
    const [userBooks] = await this.userBooksService.findAllWithPagination(skip, take);
    return userBooks;
  }

  @Query(() => UserBook, { nullable: true })
  async userBook(@Args('id', { type: () => Int }) id: number) {
    return this.userBooksService.findById(id);
  }

  @Mutation(() => UserBook)
  async createUserBook(@Args('createUserBookInput') createUserBookInput: CreateUserBookInput) {
    return this.userBooksService.create(createUserBookInput);
  }

  @Mutation(() => Boolean)
  async removeUserBook(@Args('id', { type: () => Int }) id: number) {
    await this.userBooksService.remove(id);
    return true;
  }

  @ResolveField(() => User, { nullable: true })
  async user(@Parent() userBook: UserBook) {
    if (userBook.user) {
        return userBook.user;
    }
    return this.usersService.findOne(userBook.userId);
  }

  @ResolveField(() => Book, { nullable: true })
  async book(@Parent() userBook: UserBook) {
    if (userBook.book) {
        return userBook.book;
    }
    return this.booksService.findOne(userBook.bookId);
  }
}
