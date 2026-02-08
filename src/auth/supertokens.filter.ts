import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { errorHandler } from 'supertokens-node/framework/express';
import { Error as STError } from 'supertokens-node';

@Catch(STError)
export class SupertokensExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const resp = ctx.getResponse();
    const req = ctx.getRequest();

    // Call supertokens error handler
    errorHandler()(exception, req, resp, (err) => {
        if (err) {
            resp.status(500).send(err);
        }
    });
  }
}
