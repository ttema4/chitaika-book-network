import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import type { Request, Response } from 'express';
import etag from 'etag';

@Injectable()
export class EtagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if ((context.getType() as string) === 'graphql') {
        return next.handle();
    }

    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    if (req.method !== 'GET') {
        return next.handle();
    }

    return next.handle().pipe(
      tap((data) => {
        if (res.headersSent) return;
        
        let entity: string | Buffer;
        if (typeof data === 'string' || Buffer.isBuffer(data)) {
            entity = data;
        } else if (typeof data === 'object' && data !== null) {
            entity = JSON.stringify(data);
        } else {
            return;
        }

        const generatedEtag = etag(entity);
        res.header('ETag', generatedEtag);

        const ifNoneMatch = req.header('If-None-Match');
        if (ifNoneMatch === generatedEtag) {
           res.status(304);
        }
      }),
      map(data => {
         if (res.statusCode === 304) {
             return ''; 
         }
         return data;
      })
    );
  }
}
