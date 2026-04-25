import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateUserInput {
  @Field()
  username: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  supertokens_id?: string;

  @Field({ nullable: true })
  avatar_url?: string;
}
