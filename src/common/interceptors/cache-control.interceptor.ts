import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { CACHE_CONTROL_KEY } from '../decorators/cache-control.decorator';

@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if ((context.getType() as string) === 'graphql') {
        return next.handle();
    }

    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    const cacheControl = this.reflector.get<string>(CACHE_CONTROL_KEY, context.getHandler());
    const req = ctx.getRequest();

    const isAuthenticated = req.user || (req.res && req.res.locals && req.res.locals.currentUser);

    response.header('Vary', 'Cookie');

    const className = context.getClass().name;
    const isMvc = className.endsWith('Controller') && !className.endsWith('ApiController');

    if (isMvc) {
        response.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        response.header('Pragma', 'no-cache');
        response.header('Expires', '0');
    } else if (isAuthenticated) {
        response.header('Cache-Control', 'private, no-cache, must-revalidate');
    } else if (cacheControl && !response.headersSent) {
        response.header('Cache-Control', cacheControl);
    } else {
        response.header('Cache-Control', 'private, no-cache, must-revalidate');
    }

    return next.handle();
  }
}
