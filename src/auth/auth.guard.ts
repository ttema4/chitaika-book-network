import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    let request;

    if (context.getType<string>() === 'graphql') {
        const gqlContext = GqlExecutionContext.create(context).getContext();
        request = gqlContext.req;
    } else {
        request = context.switchToHttp().getRequest();
    }
    
    if (!request) {
        return false;
    }

    if (request.user) {
        return true;
    }

    if (context.getType<string>() === 'graphql') {
        throw new UnauthorizedException('Session expired or unauthorized (GraphQL)');
    }

    const response = context.switchToHttp().getResponse();
    const isApiRequest = request.url?.startsWith('/api') || 
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
