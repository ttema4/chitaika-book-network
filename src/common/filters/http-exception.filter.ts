import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() as string === 'graphql') {
        return exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    if (response.headersSent) {
        return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal Server Error';

    const logDetails = {
        path: request.url,
        method: request.method,
        exception: exception instanceof Error ? {
            name: exception.name,
            message: exception.message,
            stack: exception.stack,
        } : exception,
    };
    this.logger.error(`Exception caught: ${JSON.stringify(logDetails)}`);

    if (exception instanceof HttpException) {
        status = exception.getStatus();
        message = exception.getResponse();
    } else if (exception instanceof QueryFailedError) {
        const driverError = (exception as any).driverError;
        status = HttpStatus.BAD_REQUEST;
        
        if (driverError?.code === '23505') {
            status = HttpStatus.CONFLICT;
            message = 'Record with these details already exists';
        } else if (driverError?.code === '23503') {
            if (driverError.detail?.includes('book_id')) {
                message = 'Specified book not found';
            } else if (driverError.detail?.includes('user_id')) {
                message = 'Specified user not found';
            } else {
                message = 'Data integrity violation (foreign key error)';
            }
        } else {
            message = 'Database operation failed';
        }
    } else if (exception instanceof EntityNotFoundError) {
        status = HttpStatus.NOT_FOUND;
        message = 'Entity not found';
    } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'An unexpected error occurred';
    }
    
    if (typeof status !== 'number' || isNaN(status)) {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    const errorResponse = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: typeof message === 'string' ? message : (message as any).message || message,
    };

    if (request.url.startsWith('/api') || request.headers.accept?.includes('application/json')) {
        response.status(status).json(errorResponse);
    } else {
        response
            .status(status)
            .render('error', { 
                message: errorResponse.message,
                statusCode: status 
            });
    }
  }
}
