import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateBookInput {
  @Field()
  title: string;

  @Field()
  author: string;

  @Field({ nullable: true })
  genre?: string;

  @Field({ nullable: true })
  description?: string;
  
  @Field({ nullable: true })
  cover_url?: string;

  @Field({ nullable: true })
  text_url?: string;
}
