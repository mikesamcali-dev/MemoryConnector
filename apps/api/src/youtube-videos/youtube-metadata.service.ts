import { Injectable } from '@nestjs/common';

interface YouTubeMetadata {
  videoId: string;
  canonicalUrl: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  creatorDisplayName: string;
  channelId?: string;
  publishedAt: string;
  durationSeconds: number;
  viewCount?: number;
  likeCount?: number;
  favoriteCount?: number;
  commentCount?: number;
  categoryId?: string;
  license?: string;
  madeForKids?: boolean;
  captionAvailable?: boolean;
  tags?: string[];
}

@Injectable()
export class YouTubeMetadataService {
  private readonly youtubeApiKey: string;

  constructor() {
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
    if (!this.youtubeApiKey) {
      console.warn('YOUTUBE_API_KEY not set - using fallback oEmbed API');
    }
  }

  /**
   * Fetch video metadata using YouTube Data API or oEmbed fallback
   */
  async fetchVideoMetadata(videoId: string): Promise<YouTubeMetadata> {
    if (this.youtubeApiKey) {
      return this.fetchFromDataAPI(videoId);
    } else {
      return this.fetchFromOEmbed(videoId);
    }
  }

  /**
   * Fetch metadata using YouTube Data API (requires API key)
   */
  private async fetchFromDataAPI(videoId: string): Promise<YouTubeMetadata> {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${videoId}&key=${this.youtubeApiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = data.items[0];
      const snippet = video.snippet;
      const contentDetails = video.contentDetails;
      const statistics = video.statistics;
      const status = video.status;

      return {
        videoId,
        canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
        title: snippet.title,
        description: snippet.description || '',
        thumbnailUrl: this.getBestThumbnail(snippet.thumbnails),
        creatorDisplayName: snippet.channelTitle,
        channelId: snippet.channelId,
        publishedAt: snippet.publishedAt,
        durationSeconds: this.parseDuration(contentDetails.duration),
        viewCount: statistics.viewCount ? parseInt(statistics.viewCount) : undefined,
        likeCount: statistics.likeCount ? parseInt(statistics.likeCount) : undefined,
        favoriteCount: statistics.favoriteCount ? parseInt(statistics.favoriteCount) : undefined,
        commentCount: statistics.commentCount ? parseInt(statistics.commentCount) : undefined,
        categoryId: snippet.categoryId,
        license: status?.license,
        madeForKids: status?.madeForKids,
        captionAvailable: contentDetails.caption === 'true',
        tags: snippet.tags || [],
      };
    } catch (error) {
      console.error('YouTube Data API error:', error);
      // Fallback to oEmbed
      return this.fetchFromOEmbed(videoId);
    }
  }

  /**
   * Fetch metadata using YouTube oEmbed API (no API key required, limited data)
   */
  private async fetchFromOEmbed(videoId: string): Promise<YouTubeMetadata> {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`YouTube oEmbed error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        videoId,
        canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
        title: data.title,
        description: '',
        thumbnailUrl: data.thumbnail_url,
        creatorDisplayName: data.author_name,
        channelId: undefined,
        publishedAt: new Date().toISOString(), // oEmbed doesn't provide this
        durationSeconds: 0, // oEmbed doesn't provide this
      };
    } catch (error) {
      console.error('YouTube oEmbed error:', error);
      throw new Error('Failed to fetch video metadata');
    }
  }

  /**
   * Get the best quality thumbnail
   */
  private getBestThumbnail(thumbnails: any): string {
    if (thumbnails.maxres) return thumbnails.maxres.url;
    if (thumbnails.high) return thumbnails.high.url;
    if (thumbnails.medium) return thumbnails.medium.url;
    if (thumbnails.default) return thumbnails.default.url;
    return '';
  }

  /**
   * Parse ISO 8601 duration (PT1H2M10S) to seconds
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Extract video ID from various YouTube URL formats
   */
  extractVideoId(url: string): string | null {
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
}
