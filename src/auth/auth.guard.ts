import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    if (!request.user) {
         // If generic guard, return false (403). 
         // But for a web app, we often want to redirect to login.
         // We can handle this via exception filter or just return false and let the controller handle it, 
         // OR we can implement a specific RedirectGuard.
         // For now, let's return false and handle redirect in ExceptionFilter or manually.
         const response = context.switchToHttp().getResponse();
         response.redirect('/login');
         return false;
    }
    return true;
  }
}
