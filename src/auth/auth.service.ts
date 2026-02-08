import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  // Called after SuperTokens logs in/registers
  async syncUser(supertokensId: string, email: string, username?: string): Promise<User> {
      let user = await this.usersService.findBySuperTokensId(supertokensId);
      if (user) {
          return user;
      }
      
      user = await this.usersService.findByEmail(email);
      if (user) {
          const updated = await this.usersService.update(user.id, { supertokens_id: supertokensId });
          return updated;
      } else {
          return this.usersService.create({ 
              username: username || email.split('@')[0], 
              email, 
              supertokens_id: supertokensId,
              role: 'user'
          });
      }
  }
}
