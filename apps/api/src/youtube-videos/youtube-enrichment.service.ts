import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { YoutubeTranscript } from 'youtube-transcript';
import OpenAI from 'openai';
import { AssemblyAI } from 'assemblyai';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { R2StorageService } from './r2-storage.service';

const execAsync = promisify(exec);

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

interface EnrichmentResult {
  transcriptText: string | null;
  transcriptSegments: TranscriptSegment[] | null;
  transcriptStatus: 'none' | 'partial' | 'full' | 'failed';
  transcriptSource: 'captions' | 'auto' | 'asr' | 'manual' | 'unknown';
  summary: string | null;
  topics: string[] | null;
}

@Injectable()
export class YouTubeEnrichmentService {
  private readonly logger = new Logger(YouTubeEnrichmentService.name);
  private openai: OpenAI | null = null;
  private assemblyai: AssemblyAI | null = null;

  constructor(
    private configService: ConfigService,
    private r2Storage: R2StorageService,
  ) {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    } else {
      this.logger.warn('OpenAI API key not found - AI enrichment will be disabled');
    }

    const assemblyaiKey = this.configService.get<string>('ASSEMBLYAI_API_KEY');
    if (assemblyaiKey) {
      this.assemblyai = new AssemblyAI({ apiKey: assemblyaiKey });
      this.logger.log('AssemblyAI initialized for transcript fallback');
    } else {
      this.logger.warn('AssemblyAI API key not found - fallback transcription will be disabled');
    }
  }

  /**
   * Enrich a YouTube video with transcript and AI-generated metadata
   */
  async enrichVideo(
    videoId: string,
    title: string,
    description: string | null,
  ): Promise<EnrichmentResult> {
    this.logger.log(`Starting enrichment for video: ${videoId}`);

    // Step 1: Fetch transcript
    const transcriptData = await this.fetchTranscript(videoId);

    // Step 2: Generate AI summary and topics if we have OpenAI
    let summary: string | null = null;
    let topics: string[] | null = null;

    const hasContent = transcriptData.transcriptText || description;

    if (this.openai && hasContent) {
      try {
        this.logger.log('Generating AI metadata with OpenAI...');
        const contentSource = transcriptData.transcriptText
          ? `transcript (${transcriptData.transcriptText.length} chars)`
          : 'description only';
        this.logger.log(`Using ${contentSource} for AI analysis`);

        const aiResult = await this.generateAIMetadata(
          title,
          description || '',
          transcriptData.transcriptText || '',
        );
        summary = aiResult.summary;
        topics = aiResult.topics;
        this.logger.log(`✅ AI metadata generated: ${topics.length} topics from ${contentSource}`);
      } catch (error: any) {
        this.logger.error(`❌ Failed to generate AI metadata: ${error.message}`);
        this.logger.error(`Error stack: ${error.stack}`);
      }
    } else {
      if (!this.openai) {
        this.logger.warn('⚠️ OpenAI not initialized - skipping AI metadata generation');
      } else {
        this.logger.warn('⚠️ No transcript or description available - skipping AI metadata generation');
        this.logger.warn(`   Title only: "${title}"`);
      }
    }

    return {
      ...transcriptData,
      summary,
      topics,
    };
  }

  /**
   * Fetch transcript for a YouTube video
   */
  private async fetchTranscript(videoId: string): Promise<{
    transcriptText: string | null;
    transcriptSegments: TranscriptSegment[] | null;
    transcriptStatus: 'none' | 'partial' | 'full' | 'failed';
    transcriptSource: 'captions' | 'auto' | 'asr' | 'manual' | 'unknown';
  }> {
    try {
      this.logger.log(`Fetching transcript for video: ${videoId}`);

      const transcript = await YoutubeTranscript.fetchTranscript(videoId);

      if (!transcript || transcript.length === 0) {
        this.logger.warn(`No transcript available from YouTube for video: ${videoId}`);
        // Throw error to trigger AssemblyAI fallback
        throw new Error('No YouTube transcript available');
      }

      // Convert transcript to our format
      const segments: TranscriptSegment[] = transcript.map((item: any) => ({
        text: item.text,
        offset: item.offset,
        duration: item.duration,
      }));

      // Combine all text
      const transcriptText = segments.map((s) => s.text).join(' ');

      this.logger.log(
        `✅ Successfully fetched transcript: ${transcriptText.length} characters, ${segments.length} segments`,
      );

      return {
        transcriptText,
        transcriptSegments: segments,
        transcriptStatus: 'full',
        transcriptSource: 'auto', // youtube-transcript typically gets auto-generated captions
      };
    } catch (error: any) {
      this.logger.error(`❌ YouTube transcript failed for ${videoId}: ${error.message}`);

      // Try AssemblyAI as fallback
      if (this.assemblyai) {
        this.logger.log(`Attempting AssemblyAI transcription fallback for video: ${videoId}`);
        try {
          return await this.fetchTranscriptWithAssemblyAI(videoId);
        } catch (assemblyError: any) {
          this.logger.error(`❌ AssemblyAI transcription also failed: ${assemblyError.message}`);
        }
      }

      return {
        transcriptText: null,
        transcriptSegments: null,
        transcriptStatus: 'failed',
        transcriptSource: 'unknown',
      };
    }
  }

  /**
   * Fetch transcript using AssemblyAI (fallback method)
   * Downloads YouTube audio with yt-dlp, uploads to R2, then transcribes via AssemblyAI
   */
  private async fetchTranscriptWithAssemblyAI(videoId: string): Promise<{
    transcriptText: string | null;
    transcriptSegments: TranscriptSegment[] | null;
    transcriptStatus: 'none' | 'partial' | 'full' | 'failed';
    transcriptSource: 'captions' | 'auto' | 'asr' | 'manual' | 'unknown';
  }> {
    if (!this.assemblyai) {
      throw new Error('AssemblyAI client not initialized');
    }

    let r2Key: string | null = null;
    let tempFilePath: string | null = null;

    try {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      this.logger.log(`Starting download of YouTube audio with yt-dlp for: ${videoUrl}`);

      // Create temp file path
      tempFilePath = path.join(os.tmpdir(), `yt-${videoId}-${Date.now()}.%(ext)s`);

      // Download audio using yt-dlp via Python module (original format, no conversion needed)
      this.logger.log('Downloading audio with yt-dlp...');
      const ytdlpCommand = `python -m yt_dlp -f "bestaudio" -o "${tempFilePath}" --quiet --no-warnings "${videoUrl}"`;

      await execAsync(ytdlpCommand, {
        maxBuffer: 100 * 1024 * 1024, // 100MB buffer
      });

      // Find the actual downloaded file (yt-dlp replaces %(ext)s with actual extension)
      const tempDir = os.tmpdir();
      const tempFiles = fs.readdirSync(tempDir).filter(f => f.startsWith(`yt-${videoId}-`));
      if (tempFiles.length === 0) {
        throw new Error('yt-dlp failed to download audio file');
      }
      tempFilePath = path.join(tempDir, tempFiles[0]);

      // Check if file was created
      if (!fs.existsSync(tempFilePath)) {
        throw new Error('yt-dlp failed to download audio file');
      }

      const stats = fs.statSync(tempFilePath);
      const fileExt = path.extname(tempFilePath);
      this.logger.log(`✅ Downloaded ${Math.round(stats.size / 1024)} KB of audio (${fileExt})`);

      // Determine content type based on file extension
      const contentTypeMap: Record<string, string> = {
        '.mp3': 'audio/mpeg',
        '.m4a': 'audio/mp4',
        '.webm': 'audio/webm',
        '.opus': 'audio/opus',
        '.ogg': 'audio/ogg',
      };
      const contentType = contentTypeMap[fileExt.toLowerCase()] || 'audio/mpeg';

      // Read file as stream
      const audioStream = fs.createReadStream(tempFilePath);

      // Upload to R2 with correct extension
      const r2FileName = `youtube-audio/${videoId}-${Date.now()}${fileExt}`;
      r2Key = r2FileName;
      this.logger.log(`Uploading audio to R2: ${r2Key}`);

      const r2Url = await this.r2Storage.uploadStream(
        r2Key,
        audioStream,
        contentType,
      );

      this.logger.log(`✅ Audio uploaded to R2: ${r2Url}`);

      // Submit transcription job to AssemblyAI with R2 URL
      this.logger.log('Submitting transcription job to AssemblyAI...');
      const transcript = await this.assemblyai.transcripts.transcribe({
        audio: r2Url,
      });

      if (transcript.status === 'error') {
        throw new Error(`AssemblyAI transcription failed: ${transcript.error}`);
      }

      if (!transcript.text) {
        return {
          transcriptText: null,
          transcriptSegments: null,
          transcriptStatus: 'none',
          transcriptSource: 'unknown',
        };
      }

      // Convert AssemblyAI words to our segment format
      const segments: TranscriptSegment[] = transcript.words?.map((word) => ({
        text: word.text,
        offset: word.start,
        duration: word.end - word.start,
      })) || [];

      this.logger.log(
        `✅ AssemblyAI transcription successful: ${transcript.text.length} characters, ${segments.length} segments`,
      );

      return {
        transcriptText: transcript.text,
        transcriptSegments: segments.length > 0 ? segments : null,
        transcriptStatus: 'full',
        transcriptSource: 'asr', // AssemblyAI uses Automatic Speech Recognition
      };
    } finally {
      // Clean up temporary local file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          this.logger.log('✅ Temporary local file cleaned up');
        } catch (cleanupError: any) {
          this.logger.warn(`⚠️ Failed to clean up temp file: ${cleanupError.message}`);
        }
      }

      // Clean up R2 file after transcription (success or failure)
      if (r2Key) {
        try {
          this.logger.log(`Cleaning up temporary R2 file: ${r2Key}`);
          await this.r2Storage.deleteFile(r2Key);
          this.logger.log('✅ Temporary R2 file cleaned up');
        } catch (cleanupError: any) {
          this.logger.warn(`⚠️ Failed to clean up R2 file: ${cleanupError.message}`);
          // Don't throw - cleanup failure shouldn't fail the transcription
        }
      }
    }
  }

  /**
   * Generate summary and topics using OpenAI
   */
  private async generateAIMetadata(
    title: string,
    description: string,
    transcript: string,
  ): Promise<{
    summary: string;
    topics: string[];
  }> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    // Limit transcript length to avoid token limits (use first 8000 chars)
    const limitedTranscript = transcript.substring(0, 8000);

    const prompt = `Analyze this YouTube video and provide:
1. A concise 2-3 sentence summary
2. A list of 3-7 main topics/themes

Title: ${title}

Description: ${description || 'No description provided'}

Transcript excerpt: ${limitedTranscript || 'No transcript available'}

Respond in JSON format:
{
  "summary": "Your summary here",
  "topics": ["topic1", "topic2", "topic3"]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that analyzes YouTube videos and extracts key information. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      const result = JSON.parse(content);
      this.logger.log('Generated AI metadata successfully');

      return {
        summary: result.summary || null,
        topics: result.topics || [],
      };
    } catch (error) {
      this.logger.error('Failed to generate AI metadata:', error);
      throw error;
    }
  }

  /**
   * Extract topics from text using OpenAI (fallback method)
   */
  async extractTopics(text: string): Promise<string[]> {
    if (!this.openai) {
      return [];
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Extract 3-7 main topics or themes from the provided text. Return only a JSON array of strings.',
          },
          {
            role: 'user',
            content: text.substring(0, 4000),
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) return [];

      const result = JSON.parse(content);
      return result.topics || [];
    } catch (error) {
      this.logger.error('Failed to extract topics:', error);
      return [];
    }
  }
}
