import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { Blob } from 'buffer';

@Injectable()
export class WhisperService {
  private readonly logger = new Logger(WhisperService.name);
  private readonly openai: OpenAI;
  private readonly costPerMinute = 0.006; // $0.006 per minute

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get('OPENAI_API_KEY'),
    });
  }

  /**
   * Transcribe audio buffer using OpenAI Whisper API
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    format: string,
    userId: string,
    biasTerms?: string[],
  ): Promise<{ text: string; duration: number }> {
    try {
      // Create a Blob from the buffer for OpenAI
      const blob = new Blob([audioBuffer], { type: format }) as any;
      blob.name = `audio.${this.getExtension(format)}`;

      // Call Whisper API with optional prompt for biasing
      const response = await this.openai.audio.transcriptions.create({
        file: blob,
        model: 'whisper-1',
        language: 'en',
        prompt: biasTerms?.length ? biasTerms.join(', ') : undefined,
      });

      // Estimate duration (approximate based on buffer size and bitrate)
      const estimatedDurationSeconds = Math.ceil(audioBuffer.length / 16000); // ~16KB/sec for opus
      const costCents = (estimatedDurationSeconds / 60) * this.costPerMinute * 100;

      // Track cost (whisper_transcription is not a standard circuit breaker operation)
      await this.prisma.aiCostTracking.create({
        data: {
          userId,
          operation: 'whisper_transcription',
          tokensUsed: 0, // N/A for audio
          costCents: costCents.toString(),
          model: 'whisper-1',
        },
      });

      return {
        text: response.text,
        duration: estimatedDurationSeconds,
      };
    } catch (error) {
      this.logger.error(`Whisper transcription failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private getExtension(mimeType: string): string {
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('mp4')) return 'm4a';
    if (mimeType.includes('wav')) return 'wav';
    return 'webm';
  }
}
