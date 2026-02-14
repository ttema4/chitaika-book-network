import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (request.url.startsWith('/api') || request.headers.accept?.includes('application/json')) {
        const message = exception instanceof HttpException 
            ? exception.getResponse() 
            : 'Internal Server Error';

        response
          .status(status)
          .json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
          });
    } else {
        response
            .status(status)
            .render('error', { 
                message: exception instanceof Error ? exception.message : 'Unknown error',
                statusCode: status 
            });
    }
  }
}
