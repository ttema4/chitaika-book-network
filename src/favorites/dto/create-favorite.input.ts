import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateFavoriteInput {
  @Field(type => Int)
  user_id: number;

  @Field(type => Int)
  book_id: number;
}
