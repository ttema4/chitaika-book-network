import { Field, Int, Float, ObjectType } from '@nestjs/graphql';
import { User } from '../../users/models/user.model';
import { Book } from '../../books/models/book.model';

@ObjectType()
export class Rating {
  @Field(type => Int)
  id: number;

  @Field(type => Int)
  rating: number;

  @Field({ nullable: true })
  review?: string;

  @Field(type => Int)
  user_id: number;

  @Field(type => Int)
  book_id: number;

  @Field(type => User)
  user: User;

  @Field(type => Book)
  book: Book;
}
