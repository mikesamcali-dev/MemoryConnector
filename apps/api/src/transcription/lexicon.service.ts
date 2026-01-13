import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LexiconService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all lexicon terms for user (sorted by usage)
   */
  async getUserLexicon(userId: string) {
    return this.prisma.userLexicon.findMany({
      where: { userId },
      orderBy: { usageCount: 'desc' },
    });
  }

  /**
   * Get bias terms for Whisper API (top 10 most used)
   */
  async getBiasTerms(userId: string): Promise<string[]> {
    const terms = await this.prisma.userLexicon.findMany({
      where: { userId },
      orderBy: { usageCount: 'desc' },
      take: 10,
      select: { term: true },
    });
    return terms.map((t) => t.term);
  }

  /**
   * Apply lexicon replacements to transcript text
   */
  async applyLexicon(userId: string, text: string): Promise<string> {
    const terms = await this.getUserLexicon(userId);
    let result = text;

    for (const { term, replacement, id } of terms) {
      if (replacement) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        if (regex.test(result)) {
          result = result.replace(regex, replacement);
          // Update usage count
          await this.prisma.userLexicon.update({
            where: { id },
            data: {
              usageCount: { increment: 1 },
              lastUsedAt: new Date(),
            },
          });
        }
      }
    }

    return result;
  }

  /**
   * Add term to user lexicon
   */
  async addTerm(userId: string, term: string, replacement?: string, weight = 1.0) {
    return this.prisma.userLexicon.upsert({
      where: {
        userId_term: { userId, term },
      },
      create: {
        userId,
        term,
        replacement,
        weight,
      },
      update: {
        replacement,
        weight,
      },
    });
  }

  /**
   * Remove term from lexicon
   */
  async removeTerm(userId: string, term: string) {
    return this.prisma.userLexicon.delete({
      where: {
        userId_term: { userId, term },
      },
    });
  }
}
