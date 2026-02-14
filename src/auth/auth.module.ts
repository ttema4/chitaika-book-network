import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthApiController } from './auth.api.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { SupertokensService } from './supertokens.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController, AuthApiController],
  providers: [AuthService, SupertokensService],
  exports: [AuthService],
})
export class AuthModule {}
