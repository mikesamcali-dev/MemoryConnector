import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class KeywordExpansionService {
  private readonly logger = new Logger(KeywordExpansionService.name);
  private readonly openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async expandKeyword(
    word: string,
  ): Promise<{ keywords: string[]; source: 'cached' | 'openai' }> {
    // 1. Normalize input (lowercase, strip punctuation)
    const normalized = this.normalizeWord(word);

    // 2. Check concept_mappings table for cached result
    const cached = await this.prisma.conceptMapping.findFirst({
      where: { normalizedTerm: normalized },
    });

    if (cached) {
      // Use cached mapping
      await this.incrementUsageCount(cached.id);
      this.logger.log(
        `Using cached keywords for "${word}": ${cached.relatedKeywords}`,
      );
      return {
        keywords: (cached.relatedKeywords as string[]).slice(0, 2),
        source: 'cached',
      };
    }

    // 3. Generate with OpenAI
    this.logger.log(`Generating keywords for "${word}" using OpenAI...`);
    const keywords = await this.generateKeywordsWithOpenAI(word);

    // 4. Cache the result
    await this.cacheConceptMapping(word, normalized, keywords);

    // 5. Return top 2 keywords
    return {
      keywords: keywords.slice(0, 2),
      source: 'openai',
    };
  }

  private normalizeWord(word: string): string {
    return word.toLowerCase().replace(/[^\w\s]/g, '').trim();
  }

  private async generateKeywordsWithOpenAI(word: string): Promise<string[]> {
    try {
      const prompt = `Given the word "${word}", identify its primary concept domains and generate 2 related keywords.

Follow this process:
1. Identify abstract domains (e.g., for "fascist": political ideology, governance, state power)
2. Generate 2 high-level related concepts from those domains
3. Return ONLY the keywords, no definitions

Example:
Word: "fascist"
Domains: political ideology, authoritarian governance
Keywords: ["authoritarianism", "totalitarianism"]

Return JSON format: { "domains": ["domain1", "domain2"], "keywords": ["keyword1", "keyword2"] }`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const keywords = result.keywords || [];

      this.logger.log(`Generated keywords for "${word}": ${keywords.join(', ')}`);

      return keywords;
    } catch (error) {
      this.logger.error(
        `Failed to generate keywords for "${word}":`,
        error.stack,
      );
      // Return empty array on error
      return [];
    }
  }

  private async cacheConceptMapping(
    term: string,
    normalized: string,
    keywords: string[],
    domains: string[] = ['general'],
  ): Promise<void> {
    try {
      await this.prisma.conceptMapping.create({
        data: {
          term,
          normalizedTerm: normalized,
          domains,
          relatedKeywords: keywords,
          source: 'openai',
          confidence: 0.8,
        },
      });

      this.logger.log(`Cached concept mapping for "${term}"`);
    } catch (error) {
      this.logger.error(
        `Failed to cache concept mapping for "${term}":`,
        error.stack,
      );
    }
  }

  private async incrementUsageCount(id: string): Promise<void> {
    try {
      await this.prisma.conceptMapping.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
      });
    } catch (error) {
      this.logger.error(
        `Failed to increment usage count for concept mapping ${id}:`,
        error.stack,
      );
    }
  }
}
