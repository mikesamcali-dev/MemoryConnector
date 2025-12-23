import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { logger } from '../logger';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request['requestId'] || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: any = undefined;
    let additionalFields: any = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        errorCode = responseObj.error || responseObj.errorCode || errorCode;
        message = responseObj.message || message;
        details = responseObj.details;

        // Extract any additional fields (like existingMemoryId)
        Object.keys(responseObj).forEach(key => {
          if (!['error', 'errorCode', 'message', 'details'].includes(key)) {
            additionalFields[key] = responseObj[key];
          }
        });
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = 'UNKNOWN_ERROR';
    }

    // Log error (never log stack traces in production responses)
    if (status >= 500) {
      logger.error(
        {
          requestId,
          status,
          errorCode,
          path: request.url,
          method: request.method,
          error: exception instanceof Error ? exception.stack : exception,
        },
        'Internal server error'
      );
    } else {
      logger.warn(
        {
          requestId,
          status,
          errorCode,
          path: request.url,
          method: request.method,
        },
        'Client error'
      );
    }

    const errorResponse = {
      error: errorCode,
      message,
      ...(details && { details }),
      ...additionalFields,
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Never expose stack traces in production
    if (process.env.NODE_ENV === 'development' && exception instanceof Error) {
      errorResponse['stack'] = exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}

