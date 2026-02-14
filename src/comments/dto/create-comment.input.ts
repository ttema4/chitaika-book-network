import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateCommentInput {
  @Field()
  content: string;

  @Field(type => Int)
  start_offset: number;

  @Field(type => Int)
  end_offset: number;

  @Field(type => Int)
  user_id: number;

  @Field(type => Int)
  book_id: number;
}
