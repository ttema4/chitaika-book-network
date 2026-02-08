import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../users/users.service';
import Session from 'supertokens-node/recipe/session';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly usersService: UsersService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
        const session = await Session.getSession(req, res, { sessionRequired: false });
        if (session) {
            const userId = session.getUserId();
            const user = await this.usersService.findBySuperTokensId(userId);
            if (user) {
                // @ts-ignore
                req.user = user;
                res.locals.currentUser = user;
                res.locals.isAuthenticated = true;
            }
        }
    } catch (err) {
        console.error('[AuthMiddleware] Session Verification Failed:', err);
    }
    next();
  }
}
