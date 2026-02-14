import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import type { Response } from 'express';

@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const ctx = context.switchToHttp();
    
    if ((context.getType() as string) === 'graphql') {
        return next.handle().pipe(tap(() => {
             console.log(`GraphQL Request took ${Date.now() - now}ms`);
        }));
    }

    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
          const elapsed = Date.now() - now;
          const className = context.getClass().name;
          const isApi = className.endsWith('ApiController');
          
          if (isApi && !response.headersSent) {
            response.header('X-Elapsed-Time', `${elapsed}ms`);
          }
          console.log(`Request to ${ctx.getRequest().url} took ${elapsed}ms`);
      }),
      map(data => {
          const className = context.getClass().name;
          const isMvc = className.endsWith('Controller') && !className.endsWith('ApiController');

          if (isMvc && typeof data === 'object' && data !== null && !Array.isArray(data)) {
               return { ...data, serverProcessingTime: `${Date.now() - now}ms` };
          }
          return data;
      })
    );
  }
}
