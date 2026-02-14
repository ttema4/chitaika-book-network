import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { FavoritesService } from './favorites.service';
import { Favorite } from './models/favorite.model';
import { CreateFavoriteInput } from './dto/create-favorite.input';
import { User } from '../users/models/user.model';
import { UsersService } from '../users/users.service';
import { Book } from '../books/models/book.model';
import { BooksService } from '../books/books.service';

@Resolver(() => Favorite)
export class FavoritesResolver {
  constructor(
    private readonly favoritesService: FavoritesService,
    private readonly usersService: UsersService,
    private readonly booksService: BooksService,
  ) {}

  @Query(() => [Favorite])
  async favorites(
      @Args('skip', { type: () => Int, nullable: true }) skip: number = 0,
      @Args('take', { type: () => Int, nullable: true }) take: number = 25,
  ) {
    const [favorites] = await this.favoritesService.findAllWithPagination(skip, take);
    return favorites;
  }

  @Query(() => Favorite, { nullable: true })
  async favorite(@Args('id', { type: () => Int }) id: number) {
    return this.favoritesService.findOne(id);
  }

  @Mutation(() => Favorite)
  async createFavorite(@Args('createFavoriteInput') createFavoriteInput: CreateFavoriteInput) {
    return this.favoritesService.add(createFavoriteInput.user_id, createFavoriteInput.book_id);
  }

  @Mutation(() => Boolean)
  async removeFavorite(@Args('id', { type: () => Int }) id: number) {
    const favorite = await this.favoritesService.findOne(id);
    if (!favorite) return false;
    await this.favoritesService.remove(favorite.user_id, favorite.book_id);
    return true;
  }

  @ResolveField(() => User, { nullable: true })
  async user(@Parent() favorite: Favorite) {
    if (favorite.user) {
        return favorite.user;
    }
    return this.usersService.findOne(favorite.user_id);
  }

  @ResolveField(() => Book, { nullable: true })
  async book(@Parent() favorite: Favorite) {
    if (favorite.book) {
        return favorite.book;
    }
    return this.booksService.findOne(favorite.book_id);
  }
}
