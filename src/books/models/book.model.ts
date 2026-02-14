import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Comment } from '../../comments/models/comment.model';
import { Rating } from '../../ratings/models/rating.model';
import { Favorite } from '../../favorites/models/favorite.model';

@ObjectType()
export class Book {
  @Field(type => Int)
  id: number;

  @Field()
  title: string;

  @Field()
  author: string;

  @Field({ nullable: true })
  cover_url?: string;

  @Field()
  text_url: string;

  @Field({ nullable: true })
  genre?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(type => [Comment], { nullable: true })
  comments?: Comment[];

  @Field(type => [Rating], { nullable: true })
  ratings?: Rating[];

  @Field(type => [Favorite], { nullable: true })
  favorites?: Favorite[];
}
