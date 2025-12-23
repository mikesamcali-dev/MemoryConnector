import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';
import { logger } from '../common/logger';

@Injectable()
export class IdempotencyService {
  constructor(private prisma: PrismaService) {}

  async checkAndReserve(
    key: string,
    userId: string,
    endpoint: string,
    requestBody: any
  ): Promise<{ isReplay: boolean; response?: any }> {
    const requestHash = createHash('sha256')
      .update(JSON.stringify(requestBody))
      .digest('hex');

    // Check for existing key
    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { idempotencyKey: key },
    });

    if (existing) {
      // Verify request body matches
      if (existing.requestHash && existing.requestHash !== requestHash) {
        logger.warn({ key, userId }, 'Idempotency key reused with different request body');
        throw new HttpException(
          {
            error: 'IDEMPOTENCY_KEY_REUSED',
            message: 'This idempotency key was already used with a different request',
          },
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      }

      // If response exists, return it
      if (existing.responseStatus && existing.responseBody) {
        return {
          isReplay: true,
          response: {
            status: existing.responseStatus,
            body: existing.responseBody,
          },
        };
      }

      // Key exists but no response yet - concurrent request
      throw new HttpException(
        {
          error: 'DUPLICATE_REQUEST',
          message: 'Request already in progress',
        },
        HttpStatus.CONFLICT
      );
    }

    // Reserve the key
    try {
      await this.prisma.idempotencyKey.create({
        data: {
          idempotencyKey: key,
          userId,
          endpoint,
          requestHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Unique violation - concurrent request
        throw new HttpException(
          {
            error: 'DUPLICATE_REQUEST',
            message: 'Request already in progress',
          },
          HttpStatus.CONFLICT
        );
      }
      throw error;
    }

    return { isReplay: false };
  }

  async storeResponse(
    key: string,
    statusCode: number,
    responseBody: any
  ): Promise<void> {
    try {
      await this.prisma.idempotencyKey.update({
        where: { idempotencyKey: key },
        data: {
          responseStatus: statusCode,
          responseBody: responseBody as any,
        },
      });
    } catch (error) {
      logger.error({ error, key }, 'Failed to store idempotency response');
    }
  }
}

