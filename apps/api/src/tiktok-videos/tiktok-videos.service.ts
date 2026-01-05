import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTikTokVideoDto } from './dto/create-tiktok-video.dto';
import { UpdateTikTokVideoDto } from './dto/update-tiktok-video.dto';
import { TikTokMetadata } from './dto/extract-metadata.dto';
import { IngestionStatus } from '@prisma/client';
import OpenAI from 'openai';
import { logger } from '../common/logger';

@Injectable()
export class TikTokVideosService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Truncate string to max length
   */
  private truncate(str: string | null | undefined, maxLength: number): string | null {
    if (!str) return null;
    return str.length > maxLength ? str.substring(0, maxLength) : str;
  }

  /**
   * Create a new TikTok video entry
   */
  async create(createDto: CreateTikTokVideoDto): Promise<any> {
    // Check if video already exists
    const existing = await this.prisma.tikTokVideo.findFirst({
      where: {
        OR: [
          { tiktokVideoId: createDto.tiktokVideoId },
          { canonicalUrl: createDto.canonicalUrl },
        ],
      },
    });

    if (existing) {
      return existing;
    }

    const video = await this.prisma.tikTokVideo.create({
      data: {
        tiktokVideoId: this.truncate(createDto.tiktokVideoId, 64) || 'unknown',
        canonicalUrl: this.truncate(createDto.canonicalUrl, 2048) || '',
        title: this.truncate(createDto.title, 512) || 'TikTok Video',
        description: createDto.description,
        thumbnailUrl: this.truncate(createDto.thumbnailUrl, 2048),
        creatorDisplayName: this.truncate(createDto.creatorDisplayName, 256) || 'Unknown Creator',
        creatorUsername: this.truncate(createDto.creatorUsername, 128),
        creatorId: this.truncate(createDto.creatorId, 64),
        publishedAt: createDto.publishedAt ? new Date(createDto.publishedAt) : null,
        durationSeconds: createDto.durationSeconds,
        transcript: createDto.transcript,
        ingestionStatus: IngestionStatus.ingested,
        ingestedAt: new Date(),
      },
    });

    return video;
  }

  /**
   * Find all TikTok videos with pagination
   */
  async findAll(skip: number = 0, take: number = 50): Promise<any[]> {
    return this.prisma.tikTokVideo.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  /**
   * Find TikTok video by ID
   */
  async findById(id: string): Promise<any> {
    const video = await this.prisma.tikTokVideo.findUnique({
      where: { id },
      include: {
        memories: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });

    if (!video) {
      throw new HttpException('TikTok video not found', HttpStatus.NOT_FOUND);
    }

    return video;
  }

  /**
   * Find TikTok videos by creator
   */
  async findByCreator(creatorUsername: string, skip: number = 0, take: number = 20): Promise<any[]> {
    return this.prisma.tikTokVideo.findMany({
      where: { creatorUsername },
      orderBy: { publishedAt: 'desc' },
      skip,
      take,
    });
  }

  /**
   * Update TikTok video
   */
  async update(id: string, updateDto: UpdateTikTokVideoDto): Promise<any> {
    const video = await this.prisma.tikTokVideo.findUnique({
      where: { id },
    });

    if (!video) {
      throw new HttpException('TikTok video not found', HttpStatus.NOT_FOUND);
    }

    return this.prisma.tikTokVideo.update({
      where: { id },
      data: {
        ...(updateDto.title && { title: this.truncate(updateDto.title, 512) }),
        ...(updateDto.description !== undefined && { description: updateDto.description }),
        ...(updateDto.thumbnailUrl !== undefined && { thumbnailUrl: this.truncate(updateDto.thumbnailUrl, 2048) }),
        ...(updateDto.creatorDisplayName && { creatorDisplayName: this.truncate(updateDto.creatorDisplayName, 256) }),
        ...(updateDto.creatorUsername !== undefined && { creatorUsername: this.truncate(updateDto.creatorUsername, 128) }),
        ...(updateDto.creatorId !== undefined && { creatorId: this.truncate(updateDto.creatorId, 64) }),
        ...(updateDto.publishedAt && { publishedAt: new Date(updateDto.publishedAt) }),
        ...(updateDto.durationSeconds !== undefined && { durationSeconds: updateDto.durationSeconds }),
      },
    });
  }

  /**
   * Extract metadata from TikTok URL using TikTok's oEmbed API
   */
  async extractMetadata(url: string): Promise<TikTokMetadata> {
    try {
      // Validate URL format
      if (!url || typeof url !== 'string') {
        throw new HttpException(
          'Invalid URL: URL must be a non-empty string',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Basic TikTok URL validation
      const isTikTokUrl = url.includes('tiktok.com') || url.includes('vm.tiktok.com');
      if (!isTikTokUrl) {
        throw new HttpException(
          'Invalid URL: Must be a TikTok URL (tiktok.com or vm.tiktok.com)',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Extract video ID from URL
      // TikTok URLs: https://www.tiktok.com/@username/video/1234567890
      // or: https://vm.tiktok.com/XXXXX (short links)
      const videoIdMatch = url.match(/\/video\/(\d+)/);
      const tiktokVideoId = videoIdMatch ? videoIdMatch[1] : url.split('/').pop() || 'unknown';

      // Call TikTok's official oEmbed API with proper headers
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;

      logger.info({ url, oembedUrl }, 'Fetching TikTok metadata from oEmbed API');

      const response = await fetch(oembedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        // Try to get detailed error from response body
        let errorDetail = response.statusText;
        try {
          const errorBody = await response.text();
          if (errorBody) {
            errorDetail = errorBody.substring(0, 200); // Limit error message length
          }
        } catch (e) {
          // Ignore if we can't read the error body
        }

        logger.warn(
          { status: response.status, statusText: response.statusText, url, errorDetail },
          'oEmbed API request failed'
        );

        throw new HttpException(
          `TikTok API returned ${response.status}: ${response.statusText}. The video may be private, deleted, or the URL may be invalid.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const oembedData = await response.json();

      // Use embed_product_id from oEmbed if available (more reliable than URL parsing)
      const videoId = oembedData.embed_product_id || tiktokVideoId;

      // Use author_unique_id from oEmbed (this is the actual username)
      const creatorUsername = oembedData.author_unique_id || null;

      // Map oEmbed response to our metadata structure
      const metadata: any = {
        tiktokVideoId: videoId,
        canonicalUrl: url,
        title: oembedData.title || 'TikTok Video',
        description: null, // oEmbed doesn't provide description
        thumbnailUrl: oembedData.thumbnail_url,
        creatorDisplayName: oembedData.author_name || 'Unknown Creator',
        creatorUsername,
        creatorId: null, // Not available from oEmbed
        publishedAt: null, // Not available from oEmbed
        durationSeconds: null, // Not available from oEmbed
      };

      logger.info({ url, metadata }, 'TikTok metadata extracted from oEmbed API');
      return metadata;
    } catch (error) {
      logger.error({ error, url }, 'Failed to extract TikTok metadata');

      // If oEmbed fails, provide minimal fallback data
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to extract metadata: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete TikTok video
   */
  async delete(id: string): Promise<void> {
    const video = await this.prisma.tikTokVideo.findUnique({
      where: { id },
    });

    if (!video) {
      throw new HttpException('TikTok video not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.tikTokVideo.delete({
      where: { id },
    });

    console.log('TikTok video deleted:', id);
  }

  /**
   * Get memories linked to a video
   */
  async getMemoriesForVideo(id: string): Promise<any[]> {
    const video = await this.prisma.tikTokVideo.findUnique({
      where: { id },
      include: {
        memories: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });

    if (!video) {
      throw new HttpException('TikTok video not found', HttpStatus.NOT_FOUND);
    }

    return video.memories;
  }

  /**
   * Re-enrich video with Whisper transcription and structured data extraction
   */
  async enrichVideo(id: string): Promise<any> {
    if (!this.openai) {
      throw new HttpException('OpenAI not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const video = await this.prisma.tikTokVideo.findUnique({
      where: { id },
    });

    if (!video) {
      throw new HttpException('TikTok video not found', HttpStatus.NOT_FOUND);
    }

    try {
      // Re-fetch the page to get video URL
      const response = await fetch(video.canonicalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const html = await response.text();

      // Extract video URL
      const analysisCompletion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Extract the direct video download URL from this TikTok page HTML. Return JSON with videoUrl field.',
          },
          {
            role: 'user',
            content: `Extract video URL from: ${html.substring(0, 100000)}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const extracted = JSON.parse(analysisCompletion.choices[0]?.message?.content || '{}');

      if (!extracted.videoUrl) {
        throw new HttpException('Could not extract video URL', HttpStatus.BAD_REQUEST);
      }

      // Download and transcribe
      const videoResponse = await fetch(extracted.videoUrl);
      if (!videoResponse.ok) {
        throw new HttpException('Failed to download video', HttpStatus.BAD_REQUEST);
      }

      const videoBuffer = await videoResponse.arrayBuffer();
      const videoFile = new File([videoBuffer], 'tiktok-video.mp4', { type: 'video/mp4' });

      // Transcribe with Whisper
      const transcription = await this.openai.audio.transcriptions.create({
        file: videoFile,
        model: 'whisper-1',
        language: 'en',
        response_format: 'verbose_json',
        temperature: 0,
      });

      // Extract structured data
      const structuredExtraction = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Extract structured data from this TikTok transcript including: summary, topic_labels, people, brands_or_products, locations, key_points, how_to_steps, numbers_and_claims, calls_to_action, links_and_handles, safety_or_medical_flags, uncertain_items. Return valid JSON.`,
          },
          {
            role: 'user',
            content: `Extract from: ${transcription.text}`,
          },
        ],
        temperature: 0,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const extractedData = JSON.parse(structuredExtraction.choices[0]?.message?.content || '{}');

      // Update video with enrichment data
      const updated = await this.prisma.tikTokVideo.update({
        where: { id },
        data: {
          transcript: transcription.text,
          extractedData,
          summary: extractedData.summary,
          lastEnrichedAt: new Date(),
        },
      });

      logger.info({ videoId: id }, 'Video enriched successfully');
      return updated;
    } catch (error) {
      logger.error({ error, videoId: id }, 'Failed to enrich video');
      throw new HttpException(
        `Failed to enrich video: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
