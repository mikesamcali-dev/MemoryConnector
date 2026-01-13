import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class ClaudeCleanupService {
  private readonly logger = new Logger(ClaudeCleanupService.name);
  private readonly anthropic: Anthropic;

  constructor(private config: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get('ANTHROPIC_API_KEY'),
    });
  }

  /**
   * Clean up transcript: fix punctuation, capitalization, formatting
   */
  async cleanupTranscript(rawTranscript: string, userLexicon?: string[]): Promise<string> {
    if (!rawTranscript?.trim()) return rawTranscript;

    const systemPrompt = `You normalize voice transcripts. Your job is to fix punctuation, capitalization, and formatting while preserving the exact meaning and tone. Do not add, remove, or change any words.`;

    const lexiconContext = userLexicon?.length
      ? `\n\nPreferred spellings and terms (use these exactly as shown):\n- ${userLexicon.join('\n- ')}`
      : '';

    const userPrompt = `Transcript:\n${rawTranscript}${lexiconContext}\n\nReturn only the cleaned transcript with proper punctuation and capitalization. Do not add explanations or commentary.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text.trim();
      }

      return rawTranscript; // Fallback
    } catch (error) {
      this.logger.error(`Claude cleanup failed: ${error.message}`, error.stack);
      return rawTranscript; // Graceful fallback
    }
  }
}
