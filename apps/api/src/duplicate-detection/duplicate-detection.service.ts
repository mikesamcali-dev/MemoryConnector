import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class DuplicateDetectionService {
  constructor(private prisma: PrismaService) {}

  computeContentHash(text: string, imageUrl?: string): string {
    const normalizedText = text.trim().toLowerCase().replace(/\s+/g, ' ');
    const content = `${normalizedText}|${imageUrl || ''}`;
    return createHash('sha256').update(content).digest('hex').slice(0, 32);
  }

  async checkRecentDuplicate(
    userId: string,
    contentHash: string,
    windowSeconds: number = 60
  ): Promise<{ isDuplicate: boolean; existingMemoryId?: string }> {
    const result = await this.prisma.$queryRaw<Array<{ memory_id: string }>>`
      SELECT id as memory_id FROM memories 
      WHERE user_id = ${userId}::uuid 
      AND content_hash = ${contentHash}
      AND created_at > NOW() - INTERVAL '${windowSeconds} seconds'
      AND state != 'DELETED'
      LIMIT 1
    `;

    if (result.length > 0) {
      return { isDuplicate: true, existingMemoryId: result[0].memory_id };
    }
    return { isDuplicate: false };
  }
}

