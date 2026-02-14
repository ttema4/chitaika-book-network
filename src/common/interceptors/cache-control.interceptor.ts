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

    if (cacheControl && !response.headersSent) {
        response.header('Cache-Control', cacheControl);
    }

    return next.handle();
  }
}
