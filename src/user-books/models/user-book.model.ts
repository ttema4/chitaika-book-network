import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/models/user.model';
import { Book } from '../../books/models/book.model';
import { UserBookStatus as StatusEnum } from '../entities/user-book.entity';

registerEnumType(StatusEnum, {
  name: 'UserBookStatus',
});

@ObjectType()
export class UserBook {
  @Field(type => Int)
  id: number;

  @Field(type => Int)
  userId: number;

  @Field(type => Int)
  bookId: number;

  @Field(type => StatusEnum)
  status: StatusEnum;

  @Field()
  updatedAt: Date;

  @Field(type => User)
  user: User;

  @Field(type => Book)
  book: Book;
}
