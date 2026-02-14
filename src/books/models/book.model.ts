import { Field, Int, ObjectType } from '@nestjs/graphql';

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
}
