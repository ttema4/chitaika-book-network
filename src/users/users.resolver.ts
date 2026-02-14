import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './models/user.model';
import { UpdateUserInput } from './dto/update-user.input';
import { Comment } from '../comments/models/comment.model';
import { CommentsService } from '../comments/comments.service';
import { Favorite } from '../favorites/models/favorite.model';
import { FavoritesService } from '../favorites/favorites.service';
import { UserBook } from '../user-books/models/user-book.model';
import { UserBooksService } from '../user-books/user-books.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly commentsService: CommentsService,
    private readonly favoritesService: FavoritesService,
    private readonly userBooksService: UserBooksService,
  ) {}

  @Query(() => [User])
  async users(
      @Args('skip', { type: () => Int, nullable: true }) skip: number = 0,
      @Args('take', { type: () => Int, nullable: true }) take: number = 25,
  ) {
    const [users] = await this.usersService.findAllWithPagination(skip, take);
    return users;
  }

  @Query(() => User, { nullable: true })
  async user(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  async updateUser(
      @Args('id', { type: () => Int }) id: number,
      @Args('updateUserInput') updateUserInput: UpdateUserInput,
  ) {
    return this.usersService.update(id, updateUserInput);
  }

  @ResolveField(() => [Comment])
  async comments(@Parent() user: User) {
      return this.commentsService.findAllByUser(user.id);
  }

  @ResolveField(() => [Favorite])
  async favorites(@Parent() user: User) {
      return this.favoritesService.findAllByUser(user.id);
  }

  @ResolveField(() => [UserBook])
  async userBooks(@Parent() user: User) {
      return this.userBooksService.findAllByUser(user.id);
  }
}
