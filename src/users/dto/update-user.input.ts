import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateUserDto } from '../dto/create-user.dto';

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  avatar_url?: string;
}
