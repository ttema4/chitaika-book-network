import { InputType, Field, Int } from '@nestjs/graphql';
import { UserBookStatus } from '../entities/user-book.entity';

@InputType()
export class CreateUserBookInput {
  @Field(type => Int)
  userId: number;

  @Field(type => Int)
  bookId: number;

  @Field(type => UserBookStatus)
  status: UserBookStatus;
}
