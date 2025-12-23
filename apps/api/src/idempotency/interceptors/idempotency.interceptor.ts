import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IdempotencyService } from '../idempotency.service';
import { Request, Response } from 'express';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private idempotencyService: IdempotencyService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const key = request.headers['idempotency-key'] as string;

    // No key = no idempotency protection
    if (!key) {
      return next.handle();
    }

    const user = request['user'] as any;
    if (!user || !user.id) {
      return next.handle(); // Let auth guard handle this
    }

    const endpoint = `${request.method}:${request.path}`;
    const requestBody = request.body;

    // Check and reserve key
    const result = await this.idempotencyService.checkAndReserve(
      key,
      user.id,
      endpoint,
      requestBody
    );

    // If replay, return cached response
    if (result.isReplay && result.response) {
      response.setHeader('X-Idempotency-Replayed', 'true');
      response.status(result.response.status);
      return of(result.response.body);
    }

    // Store response will be handled in the tap operator below

    return next.handle().pipe(
      tap({
        next: (data) => {
          // Store successful response
          this.idempotencyService.storeResponse(key, response.statusCode, data).catch(() => {});
        },
        error: (error) => {
          // Store error response if it's an HttpException
          if (error instanceof HttpException) {
            const status = error.getStatus();
            const errorResponse = error.getResponse();
            this.idempotencyService
              .storeResponse(key, status, errorResponse)
              .catch(() => {});
          }
        },
      })
    );
  }
}

