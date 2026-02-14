import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Comment {
  @Field(type => Int)
  id: number;

  @Field()
  content: string;

  @Field(type => Int)
  start_offset: number;

  @Field(type => Int)
  end_offset: number;

  @Field()
  created_at: Date;

  @Field(type => Int)
  user_id: number;

  @Field(type => Int)
  book_id: number;
}
