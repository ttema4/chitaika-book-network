import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateRatingInput {
  @Field(type => Int)
  user_id: number;

  @Field(type => Int)
  book_id: number;

  @Field(type => Int)
  rating: number;

  @Field({ nullable: true })
  review?: string;
}
