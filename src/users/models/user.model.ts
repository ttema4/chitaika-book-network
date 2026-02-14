import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Comment } from '../../comments/models/comment.model';
import { Favorite } from '../../favorites/models/favorite.model';
import { UserBook } from '../../user-books/models/user-book.model';

@ObjectType()
export class User {
  @Field(type => Int)
  id: number;

  @Field()
  username: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  avatar_url?: string;

  @Field(type => Int)
  booksReadCount: number;

  @Field()
  role: string;

  @Field(type => [Comment], { nullable: true })
  comments?: Comment[];

  @Field(type => [Favorite], { nullable: true })
  favorites?: Favorite[];

  @Field(type => [UserBook], { nullable: true })
  userBooks?: UserBook[];
}
