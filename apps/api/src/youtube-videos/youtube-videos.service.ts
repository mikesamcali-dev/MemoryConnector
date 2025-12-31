import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateYouTubeVideoDto } from './dto/create-youtube-video.dto';
import { UpdateYouTubeVideoDto } from './dto/update-youtube-video.dto';
import { YouTubeMetadataService } from './youtube-metadata.service';
import { YouTubeEnrichmentService } from './youtube-enrichment.service';

@Injectable()
export class YouTubeVideosService {
  private readonly logger = new Logger(YouTubeVideosService.name);

  constructor(
    private prisma: PrismaService,
    private youtubeMetadata: YouTubeMetadataService,
    private youtubeEnrichment: YouTubeEnrichmentService,
  ) {}

  /**
   * Create a new YouTube video record
   */
  async create(createDto: CreateYouTubeVideoDto): Promise<any> {
    // Check if video already exists
    const existing = await this.findByYouTubeId(createDto.youtubeVideoId);
    if (existing) {
      console.log('YouTube video already exists:', existing.id);
      return existing;
    }

    console.log('Creating new YouTube video:', createDto.title);

    const video = await this.prisma.youTubeVideo.create({
      data: {
        youtubeVideoId: createDto.youtubeVideoId,
        canonicalUrl: createDto.canonicalUrl,
        title: createDto.title,
        description: createDto.description || null,
        thumbnailUrl: createDto.thumbnailUrl || null,
        creatorDisplayName: createDto.creatorDisplayName,
        channelId: createDto.channelId || null,
        publishedAt: new Date(createDto.publishedAt),
        durationSeconds: createDto.durationSeconds,
        languageCode: createDto.languageCode,
        transcriptStatus: createDto.transcriptStatus,
        transcriptSource: createDto.transcriptSource,
        transcriptText: createDto.transcriptText || null,
        transcriptSegments: createDto.transcriptSegments || null,
        summary: createDto.summary || null,
        topics: createDto.topics || null,
        chapters: createDto.chapters || null,
        viewCount: createDto.viewCount ? BigInt(createDto.viewCount) : null,
        likeCount: createDto.likeCount ? BigInt(createDto.likeCount) : null,
        categoryId: createDto.categoryId || null,
        tags: createDto.tags || null,
        externalLinks: createDto.externalLinks || null,
        contentHash: createDto.contentHash || null,
        ingestionStatus: createDto.ingestionStatus || 'queued',
        ingestedAt: createDto.ingestionStatus === 'ingested' ? new Date() : null,
      },
    });

    console.log('YouTube video created:', video.id);
    return this.serializeVideo(video);
  }

  /**
   * Find all YouTube videos
   */
  async findAll(skip: number = 0, take: number = 50): Promise<any[]> {
    const videos = await this.prisma.youTubeVideo.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { memories: true },
        },
      },
    });

    return videos.map(v => this.serializeVideo(v));
  }

  /**
   * Find video by internal ID
   */
  async findById(id: string): Promise<any> {
    const video = await this.prisma.youTubeVideo.findUnique({
      where: { id },
      include: {
        _count: {
          select: { memories: true },
        },
      },
    });

    if (!video) {
      throw new HttpException('YouTube video not found', HttpStatus.NOT_FOUND);
    }

    return this.serializeVideo(video);
  }

  /**
   * Find video by YouTube video ID
   */
  async findByYouTubeId(youtubeVideoId: string): Promise<any | null> {
    const video = await this.prisma.youTubeVideo.findUnique({
      where: {
        platform_youtubeVideoId: {
          platform: 'youtube',
          youtubeVideoId: youtubeVideoId,
        },
      },
      include: {
        _count: {
          select: { memories: true },
        },
      },
    });

    return video ? this.serializeVideo(video) : null;
  }

  /**
   * Find video by canonical URL
   */
  async findByUrl(canonicalUrl: string): Promise<any | null> {
    const video = await this.prisma.youTubeVideo.findUnique({
      where: { canonicalUrl },
      include: {
        _count: {
          select: { memories: true },
        },
      },
    });

    return video ? this.serializeVideo(video) : null;
  }

  /**
   * Search videos by title, creator, description, summary, topics, or transcript
   */
  async search(query: string, skip: number = 0, take: number = 20): Promise<any[]> {
    const videos = await this.prisma.youTubeVideo.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { creatorDisplayName: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { summary: { contains: query, mode: 'insensitive' } },
          { transcriptText: { contains: query, mode: 'insensitive' } },
        ],
      },
      skip,
      take,
      orderBy: { publishedAt: 'desc' },
      include: {
        _count: {
          select: { memories: true },
        },
      },
    });

    return videos.map(v => this.serializeVideo(v));
  }

  /**
   * Get videos by channel ID
   */
  async findByChannel(channelId: string, skip: number = 0, take: number = 20): Promise<any[]> {
    const videos = await this.prisma.youTubeVideo.findMany({
      where: { channelId },
      skip,
      take,
      orderBy: { publishedAt: 'desc' },
      include: {
        _count: {
          select: { memories: true },
        },
      },
    });

    return videos.map(v => this.serializeVideo(v));
  }

  /**
   * Update a YouTube video
   */
  async update(id: string, updateDto: UpdateYouTubeVideoDto): Promise<any> {
    const video = await this.prisma.youTubeVideo.findUnique({
      where: { id },
    });

    if (!video) {
      throw new HttpException('YouTube video not found', HttpStatus.NOT_FOUND);
    }

    const updated = await this.prisma.youTubeVideo.update({
      where: { id },
      data: {
        ...(updateDto.title !== undefined && { title: updateDto.title }),
        ...(updateDto.description !== undefined && { description: updateDto.description }),
        ...(updateDto.thumbnailUrl !== undefined && { thumbnailUrl: updateDto.thumbnailUrl }),
        ...(updateDto.creatorDisplayName !== undefined && {
          creatorDisplayName: updateDto.creatorDisplayName,
        }),
        ...(updateDto.channelId !== undefined && { channelId: updateDto.channelId }),
        ...(updateDto.durationSeconds !== undefined && {
          durationSeconds: updateDto.durationSeconds,
        }),
        ...(updateDto.languageCode !== undefined && { languageCode: updateDto.languageCode }),
        ...(updateDto.transcriptStatus !== undefined && {
          transcriptStatus: updateDto.transcriptStatus,
        }),
        ...(updateDto.transcriptSource !== undefined && {
          transcriptSource: updateDto.transcriptSource,
        }),
        ...(updateDto.transcriptText !== undefined && {
          transcriptText: updateDto.transcriptText,
        }),
        ...(updateDto.transcriptSegments !== undefined && {
          transcriptSegments: updateDto.transcriptSegments,
        }),
        ...(updateDto.summary !== undefined && { summary: updateDto.summary }),
        ...(updateDto.topics !== undefined && { topics: updateDto.topics }),
        ...(updateDto.chapters !== undefined && { chapters: updateDto.chapters }),
        ...(updateDto.viewCount !== undefined && { viewCount: BigInt(updateDto.viewCount) }),
        ...(updateDto.likeCount !== undefined && { likeCount: BigInt(updateDto.likeCount) }),
        ...(updateDto.categoryId !== undefined && { categoryId: updateDto.categoryId }),
        ...(updateDto.tags !== undefined && { tags: updateDto.tags }),
        ...(updateDto.externalLinks !== undefined && { externalLinks: updateDto.externalLinks }),
        ...(updateDto.contentHash !== undefined && { contentHash: updateDto.contentHash }),
        ...(updateDto.ingestionStatus !== undefined && {
          ingestionStatus: updateDto.ingestionStatus,
        }),
        ...(updateDto.lastIngestionError !== undefined && {
          lastIngestionError: updateDto.lastIngestionError,
        }),
      },
      include: {
        _count: {
          select: { memories: true },
        },
      },
    });

    console.log('YouTube video updated:', updated.id);
    return this.serializeVideo(updated);
  }

  /**
   * Delete a YouTube video
   */
  async delete(id: string): Promise<void> {
    const video = await this.prisma.youTubeVideo.findUnique({
      where: { id },
    });

    if (!video) {
      throw new HttpException('YouTube video not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.youTubeVideo.delete({
      where: { id },
    });

    console.log('YouTube video deleted:', id);
  }

  /**
   * Get memories linked to a video
   */
  async getMemoriesForVideo(id: string): Promise<any[]> {
    const video = await this.prisma.youTubeVideo.findUnique({
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
      throw new HttpException('YouTube video not found', HttpStatus.NOT_FOUND);
    }

    return video.memories;
  }

  /**
   * Create or find video from URL (auto-fetches metadata)
   */
  async createFromUrl(url: string): Promise<any> {
    // Extract video ID
    const videoId = this.youtubeMetadata.extractVideoId(url);
    if (!videoId) {
      throw new HttpException('Invalid YouTube URL', HttpStatus.BAD_REQUEST);
    }

    // Check if video already exists
    const existing = await this.findByYouTubeId(videoId);
    if (existing) {
      this.logger.log('YouTube video already exists:', existing.id);
      return existing;
    }

    this.logger.log(`Fetching metadata for YouTube video: ${videoId}`);

    // Fetch metadata
    const metadata = await this.youtubeMetadata.fetchVideoMetadata(videoId);

    // Create video record
    const video = await this.prisma.youTubeVideo.create({
      data: {
        youtubeVideoId: metadata.videoId,
        canonicalUrl: metadata.canonicalUrl,
        title: metadata.title,
        description: metadata.description || null,
        thumbnailUrl: metadata.thumbnailUrl || null,
        creatorDisplayName: metadata.creatorDisplayName,
        channelId: metadata.channelId || null,
        publishedAt: new Date(metadata.publishedAt),
        durationSeconds: metadata.durationSeconds,
        languageCode: 'en', // Default, can be enhanced later
        license: metadata.license || null,
        madeForKids: metadata.madeForKids ?? null,
        captionAvailable: metadata.captionAvailable ?? null,
        transcriptStatus: 'none',
        transcriptSource: 'unknown',
        viewCount: metadata.viewCount ? BigInt(metadata.viewCount) : null,
        likeCount: metadata.likeCount ? BigInt(metadata.likeCount) : null,
        favoriteCount: metadata.favoriteCount ? BigInt(metadata.favoriteCount) : null,
        commentCount: metadata.commentCount ? BigInt(metadata.commentCount) : null,
        categoryId: metadata.categoryId || null,
        tags: metadata.tags || null,
        capturedAt: new Date(), // Statistics snapshot time
        ingestionStatus: 'queued',
        ingestedAt: null,
      },
    });

    this.logger.log(`YouTube video created from URL: ${video.id}`);

    // Enrich video asynchronously (fire and forget)
    this.enrichVideoAsync(video.id, videoId, metadata.title, metadata.description || null);

    return this.serializeVideo(video);
  }

  /**
   * Enrich video with transcript and AI metadata (async background task)
   */
  private async enrichVideoAsync(
    id: string,
    videoId: string,
    title: string,
    description: string | null,
  ): Promise<void> {
    try {
      this.logger.log(`Starting background enrichment for video: ${id}`);

      // Fetch transcript and generate AI metadata
      const enrichmentResult = await this.youtubeEnrichment.enrichVideo(
        videoId,
        title,
        description,
      );

      // Update video with enrichment data
      await this.prisma.youTubeVideo.update({
        where: { id },
        data: {
          transcriptText: enrichmentResult.transcriptText,
          transcriptSegments: enrichmentResult.transcriptSegments as any,
          transcriptStatus: enrichmentResult.transcriptStatus,
          transcriptSource: enrichmentResult.transcriptSource,
          summary: enrichmentResult.summary,
          topics: enrichmentResult.topics as any,
          ingestionStatus: 'ingested',
          ingestedAt: new Date(),
          lastEnrichedAt: new Date(),
        },
      });

      this.logger.log(`Video enrichment completed: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to enrich video ${id}:`, error);

      // Update status to show failure
      await this.prisma.youTubeVideo.update({
        where: { id },
        data: {
          ingestionStatus: 'failed',
          lastIngestionError: error.message || 'Unknown error during enrichment',
        },
      });
    }
  }

  /**
   * Manually trigger enrichment for an existing video
   */
  async triggerEnrichment(id: string): Promise<any> {
    const video = await this.prisma.youTubeVideo.findUnique({
      where: { id },
    });

    if (!video) {
      throw new HttpException('YouTube video not found', HttpStatus.NOT_FOUND);
    }

    this.logger.log(`Manually triggering enrichment for video: ${id}`);

    // Trigger enrichment asynchronously
    this.enrichVideoAsync(
      video.id,
      video.youtubeVideoId,
      video.title,
      video.description,
    );

    return {
      message: 'Enrichment triggered',
      videoId: id,
      status: 'queued',
    };
  }

  /**
   * Extract YouTube video ID from URL
   */
  extractVideoIdFromUrl(url: string): string | null {
    // Support various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Build canonical URL from video ID
   */
  buildCanonicalUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  /**
   * Serialize video for API response (convert BigInt to number)
   */
  private serializeVideo(video: any): any {
    return {
      ...video,
      viewCount: video.viewCount ? Number(video.viewCount) : null,
      likeCount: video.likeCount ? Number(video.likeCount) : null,
      favoriteCount: video.favoriteCount ? Number(video.favoriteCount) : null,
      commentCount: video.commentCount ? Number(video.commentCount) : null,
    };
  }
}
