import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTwitterPostDto } from './dto/create-twitter-post.dto';
import { UpdateTwitterPostDto } from './dto/update-twitter-post.dto';
import { TwitterMetadata } from './dto/extract-metadata.dto';
import { IngestionStatus } from '@prisma/client';
import OpenAI from 'openai';
import { logger } from '../common/logger';

@Injectable()
export class TwitterPostsService {
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
   * Create a new Twitter post entry
   */
  async create(userId: string, createDto: CreateTwitterPostDto): Promise<any> {
    // Check if post already exists
    const existing = await this.prisma.twitterPost.findFirst({
      where: {
        OR: [
          { twitterPostId: createDto.twitterPostId },
          { canonicalUrl: createDto.canonicalUrl },
        ],
      },
    });

    if (existing) {
      return existing;
    }

    const post = await this.prisma.twitterPost.create({
      data: {
        userId,
        twitterPostId: this.truncate(createDto.twitterPostId, 64) || 'unknown',
        canonicalUrl: this.truncate(createDto.canonicalUrl, 2048) || '',
        text: this.truncate(createDto.text, 10000) || 'Twitter Post',
        thumbnailUrl: this.truncate(createDto.thumbnailUrl, 2048),
        creatorDisplayName: this.truncate(createDto.creatorDisplayName, 256) || 'Unknown User',
        creatorUsername: this.truncate(createDto.creatorUsername, 128),
        creatorId: this.truncate(createDto.creatorId, 64),
        publishedAt: createDto.publishedAt ? new Date(createDto.publishedAt) : new Date(),
        languageCode: this.truncate(createDto.languageCode, 12),
        viewCount: createDto.viewCount ? BigInt(createDto.viewCount) : null,
        likeCount: createDto.likeCount ? BigInt(createDto.likeCount) : null,
        replyCount: createDto.replyCount ? BigInt(createDto.replyCount) : null,
        retweetCount: createDto.retweetCount ? BigInt(createDto.retweetCount) : null,
        quoteCount: createDto.quoteCount ? BigInt(createDto.quoteCount) : null,
        bookmarkCount: createDto.bookmarkCount ? BigInt(createDto.bookmarkCount) : null,
        hasMedia: createDto.hasMedia || false,
        mediaUrls: createDto.mediaUrls || null,
        mediaTypes: createDto.mediaTypes || null,
        hashtags: createDto.hashtags || null,
        mentions: createDto.mentions || null,
        externalLinks: createDto.externalLinks || null,
        isReply: createDto.isReply || false,
        isRetweet: createDto.isRetweet || false,
        isQuote: createDto.isQuote || false,
        ingestionStatus: IngestionStatus.ingested,
        ingestedAt: new Date(),
        capturedAt: new Date(),
      },
    });

    // Convert BigInts to numbers for JSON serialization
    return this.serializePost(post);
  }

  /**
   * Convert BigInt fields to numbers for JSON serialization
   */
  private serializePost(post: any): any {
    if (!post) return post;
    return {
      ...post,
      viewCount: post.viewCount ? Number(post.viewCount) : null,
      likeCount: post.likeCount ? Number(post.likeCount) : null,
      replyCount: post.replyCount ? Number(post.replyCount) : null,
      retweetCount: post.retweetCount ? Number(post.retweetCount) : null,
      quoteCount: post.quoteCount ? Number(post.quoteCount) : null,
      bookmarkCount: post.bookmarkCount ? Number(post.bookmarkCount) : null,
    };
  }

  /**
   * Find all Twitter posts for a user with pagination
   */
  async findAll(userId: string, skip: number = 0, take: number = 50): Promise<any[]> {
    const posts = await this.prisma.twitterPost.findMany({
      where: { userId },
      orderBy: { publishedAt: 'desc' },
      skip,
      take,
    });

    return posts.map(post => this.serializePost(post));
  }

  /**
   * Find Twitter post by ID
   */
  async findById(id: string): Promise<any> {
    const post = await this.prisma.twitterPost.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true },
        },
        memories: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });

    if (!post) {
      throw new HttpException('Twitter post not found', HttpStatus.NOT_FOUND);
    }

    return this.serializePost(post);
  }

  /**
   * Find Twitter posts by creator
   */
  async findByCreator(userId: string, creatorUsername: string, skip: number = 0, take: number = 20): Promise<any[]> {
    const posts = await this.prisma.twitterPost.findMany({
      where: {
        userId,
        creatorUsername
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take,
    });

    return posts.map(post => this.serializePost(post));
  }

  /**
   * Update Twitter post
   */
  async update(id: string, updateDto: UpdateTwitterPostDto): Promise<any> {
    const post = await this.prisma.twitterPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new HttpException('Twitter post not found', HttpStatus.NOT_FOUND);
    }

    const updated = await this.prisma.twitterPost.update({
      where: { id },
      data: {
        ...(updateDto.text && { text: this.truncate(updateDto.text, 10000) }),
        ...(updateDto.thumbnailUrl !== undefined && { thumbnailUrl: this.truncate(updateDto.thumbnailUrl, 2048) }),
        ...(updateDto.creatorDisplayName && { creatorDisplayName: this.truncate(updateDto.creatorDisplayName, 256) }),
        ...(updateDto.creatorUsername !== undefined && { creatorUsername: this.truncate(updateDto.creatorUsername, 128) }),
        ...(updateDto.creatorId !== undefined && { creatorId: this.truncate(updateDto.creatorId, 64) }),
        ...(updateDto.publishedAt && { publishedAt: new Date(updateDto.publishedAt) }),
        ...(updateDto.languageCode !== undefined && { languageCode: this.truncate(updateDto.languageCode, 12) }),
        ...(updateDto.viewCount !== undefined && { viewCount: BigInt(updateDto.viewCount) }),
        ...(updateDto.likeCount !== undefined && { likeCount: BigInt(updateDto.likeCount) }),
        ...(updateDto.replyCount !== undefined && { replyCount: BigInt(updateDto.replyCount) }),
        ...(updateDto.retweetCount !== undefined && { retweetCount: BigInt(updateDto.retweetCount) }),
        ...(updateDto.quoteCount !== undefined && { quoteCount: BigInt(updateDto.quoteCount) }),
        ...(updateDto.bookmarkCount !== undefined && { bookmarkCount: BigInt(updateDto.bookmarkCount) }),
      },
    });

    return this.serializePost(updated);
  }

  /**
   * Extract metadata from Twitter URL
   * Uses basic URL parsing since Twitter's oEmbed API requires authentication
   */
  async extractMetadata(url: string): Promise<TwitterMetadata> {
    try {
      // Validate URL format
      if (!url || typeof url !== 'string') {
        throw new HttpException(
          'Invalid URL: URL must be a non-empty string',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Basic Twitter/X URL validation
      const isTwitterUrl = url.includes('twitter.com') || url.includes('x.com');
      if (!isTwitterUrl) {
        throw new HttpException(
          'Invalid URL: Must be a Twitter/X URL (twitter.com or x.com)',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Extract post ID from URL
      // Twitter URLs: https://twitter.com/username/status/1234567890
      // or: https://x.com/username/status/1234567890
      const statusMatch = url.match(/\/status\/(\d+)/);
      const twitterPostId = statusMatch ? statusMatch[1] : url.split('/').pop() || 'unknown';

      // Extract username from URL
      const usernameMatch = url.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/);
      const creatorUsername = usernameMatch ? usernameMatch[1] : null;

      logger.info({ url, twitterPostId, creatorUsername }, 'Extracting Twitter post metadata');

      // Return basic metadata (Twitter's API requires auth for more details)
      const metadata: TwitterMetadata = {
        twitterPostId,
        canonicalUrl: url,
        text: 'Twitter Post', // Will be updated when linked to memory
        creatorDisplayName: creatorUsername || 'Unknown User',
        creatorUsername,
        publishedAt: new Date().toISOString(),
      };

      logger.info({ url, metadata }, 'Twitter post metadata extracted');
      return metadata;
    } catch (error) {
      logger.error({ error, url }, 'Failed to extract Twitter post metadata');

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
   * Delete Twitter post
   */
  async delete(id: string): Promise<void> {
    const post = await this.prisma.twitterPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new HttpException('Twitter post not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.twitterPost.delete({
      where: { id },
    });

    logger.info({ postId: id }, 'Twitter post deleted');
  }

  /**
   * Get memories linked to a post
   */
  async getMemoriesForPost(id: string): Promise<any[]> {
    const post = await this.prisma.twitterPost.findUnique({
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

    if (!post) {
      throw new HttpException('Twitter post not found', HttpStatus.NOT_FOUND);
    }

    return post.memories;
  }

  /**
   * Enrich post with AI analysis
   */
  async enrichPost(id: string): Promise<any> {
    if (!this.openai) {
      throw new HttpException('OpenAI not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const post = await this.prisma.twitterPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new HttpException('Twitter post not found', HttpStatus.NOT_FOUND);
    }

    try {
      // Extract topics and sentiment from post text
      const analysis = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Analyze this tweet and extract: summary (brief), topics (array), sentiment (positive/negative/neutral). Return valid JSON.',
          },
          {
            role: 'user',
            content: post.text,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const extracted = JSON.parse(analysis.choices[0]?.message?.content || '{}');

      // Update post with enrichment data
      const updated = await this.prisma.twitterPost.update({
        where: { id },
        data: {
          summary: extracted.summary,
          topics: extracted.topics || [],
          sentiment: extracted.sentiment,
          lastEnrichedAt: new Date(),
        },
      });

      logger.info({ postId: id }, 'Twitter post enriched successfully');
      return this.serializePost(updated);
    } catch (error) {
      logger.error({ error, postId: id }, 'Failed to enrich Twitter post');
      throw new HttpException(
        `Failed to enrich post: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
