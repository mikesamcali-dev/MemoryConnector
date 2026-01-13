import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhisperService } from './whisper.service';
import { LexiconService } from './lexicon.service';
import { ClaudeCleanupService } from './claude-cleanup.service';
import { UsageService } from '../modules/usage/usage.service';
import * as crypto from 'crypto';

@Injectable()
export class TranscriptionService {
  constructor(
    private prisma: PrismaService,
    private whisperService: WhisperService,
    private lexiconService: LexiconService,
    private claudeCleanup: ClaudeCleanupService,
    private usageService: UsageService,
  ) {}

  /**
   * Batch transcription workflow
   */
  async transcribeBatch(userId: string, audioBuffer: Buffer, format: string) {
    // Step 1: Get bias terms from lexicon
    const biasTerms = await this.lexiconService.getBiasTerms(userId);

    // Step 2: Transcribe with Whisper
    const { text: rawText, duration } = await this.whisperService.transcribeAudio(
      audioBuffer,
      format,
      userId,
      biasTerms,
    );

    // Step 3: Apply lexicon replacements
    const lexiconText = await this.lexiconService.applyLexicon(userId, rawText);

    // Step 4: Cleanup with Claude
    const finalText = await this.claudeCleanup.cleanupTranscript(lexiconText, biasTerms);

    // Step 5: Track usage (voice minutes)
    const minutes = Math.ceil(duration / 60);
    await this.usageService.incrementVoiceUsage(userId, minutes);

    // Step 6: Create session record (no audio stored)
    const session = await this.prisma.speechSession.create({
      data: {
        userId,
        sessionKey: crypto.randomUUID(),
        status: 'completed',
        audioFormat: format,
        durationMs: duration * 1000,
        chunkCount: 1,
        finalTranscript: finalText,
        processingStartedAt: new Date(),
        processingEndedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    return {
      sessionId: session.id,
      rawTranscript: rawText,
      finalTranscript: finalText,
      durationSeconds: duration,
    };
  }

  /**
   * Submit user corrections
   */
  async submitFeedback(
    userId: string,
    sessionId: string,
    rawTranscript: string,
    correctedText: string,
    consentStore: boolean,
  ) {
    // Extract corrections (simple diff)
    const corrections = this.extractCorrections(rawTranscript, correctedText);

    // Store feedback
    await this.prisma.transcriptFeedback.create({
      data: {
        userId,
        sessionId,
        rawTranscript,
        correctedText,
        corrections,
        consentStore,
      },
    });

    // Auto-add new terms to lexicon (if consented)
    if (consentStore) {
      for (const correction of corrections) {
        if (correction.corrected.length > 2 && correction.corrected.length < 50) {
          await this.lexiconService.addTerm(userId, correction.corrected);
        }
      }
    }

    return { success: true, correctionsCount: corrections.length };
  }

  private extractCorrections(raw: string, corrected: string) {
    // Simple word-level diff (can be enhanced with proper diff library)
    const rawWords = raw.split(/\s+/);
    const correctedWords = corrected.split(/\s+/);
    const corrections = [];

    rawWords.forEach((word, i) => {
      if (correctedWords[i] && word.toLowerCase() !== correctedWords[i].toLowerCase()) {
        corrections.push({
          original: word,
          corrected: correctedWords[i],
          type: 'term',
        });
      }
    });

    return corrections;
  }
}
