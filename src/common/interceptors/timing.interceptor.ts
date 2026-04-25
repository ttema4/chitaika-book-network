import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import type { Request, Response } from 'express';

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

    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const isSse = request.headers.accept === 'text/event-stream';

    return next.handle().pipe(
      tap(() => {
          if (isSse || response.headersSent) return;
          
          const elapsed = Date.now() - now;
          const className = context.getClass().name;
          const isApi = className.endsWith('ApiController');
          
          if (isApi) {
            response.header('X-Elapsed-Time', `${elapsed}ms`);
          }
      }),
      map(data => {
          if (isSse) return data;
          
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
