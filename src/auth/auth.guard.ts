import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    
    if (request.user) {
        return true;
    }

    const response = context.switchToHttp().getResponse();
    
    // PATCH, PUT, DELETE are always programmatic. 
    // Also check for /api prefix or application/json header.
    const isApiRequest = request.url.startsWith('/api') || 
                         request.headers['accept']?.includes('application/json') ||
                         ['PATCH', 'PUT', 'DELETE'].includes(request.method);

    if (isApiRequest) {
        throw new UnauthorizedException('Session expired or unauthorized');
    } else {
        response.redirect('/login');
        return false;
    }
  }
}
