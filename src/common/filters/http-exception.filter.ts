import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() as string === 'graphql') {
        return exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal Server Error';

    if (exception instanceof HttpException) {
        status = exception.getStatus();
        message = exception.getResponse();
    } else if (exception instanceof QueryFailedError) {
        if (exception.driverError?.code === '23505') {
            status = HttpStatus.CONFLICT;
            message = 'Duplicate entry';
        } else {
            status = HttpStatus.BAD_REQUEST;
            message = exception.message;
        }
    } else if (exception instanceof EntityNotFoundError) {
        status = HttpStatus.NOT_FOUND;
        message = 'Entity not found';
    } else if (exception instanceof Error) {
        message = exception.message;
    }

    if (request.url.startsWith('/api') || request.headers.accept?.includes('application/json')) {
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
                message: typeof message === 'string' ? message : JSON.stringify(message),
                statusCode: status 
            });
    }
  }
}
