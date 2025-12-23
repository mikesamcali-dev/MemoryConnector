import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { logger } from '../logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const requestId = request['requestId'] || 'unknown';
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - now;

          logger.info(
            {
              requestId,
              method,
              url,
              statusCode,
              duration,
            },
            'Request completed'
          );
        },
        error: (error) => {
          const duration = Date.now() - now;
          logger.error(
            {
              requestId,
              method,
              url,
              error: error.message,
              duration,
            },
            'Request failed'
          );
        },
      })
    );
  }
}

