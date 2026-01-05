import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AddUrlDto } from './dto/add-url.dto';
import { createHash } from 'crypto';
import { logger } from '../common/logger';
import OpenAI from 'openai';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class UrlPagesService {
  private openai: OpenAI | null = null;

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
   * Calculate SHA256 hash of URL
   */
  private calculateSHA256(url: string): string {
    return createHash('sha256').update(url).digest('hex');
  }

  /**
   * Normalize URL to canonical form
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove trailing slash
      urlObj.pathname = urlObj.pathname.replace(/\/$/, '');
      // Remove common tracking parameters
      const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
      paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }

  /**
   * Fetch and parse webpage content
   */
  private async fetchWebpage(url: string): Promise<any> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract metadata from HTML
      const metadata: any = {
        title: $('title').text() ||
                $('meta[property="og:title"]').attr('content') ||
                $('meta[name="twitter:title"]').attr('content'),
        description: $('meta[name="description"]').attr('content') ||
                     $('meta[property="og:description"]').attr('content') ||
                     $('meta[name="twitter:description"]').attr('content'),
        author: $('meta[name="author"]').attr('content') ||
                $('meta[property="article:author"]').attr('content'),
        publishedAt: $('meta[property="article:published_time"]').attr('content') ||
                     $('meta[name="date"]').attr('content'),
        siteName: $('meta[property="og:site_name"]').attr('content'),
        imageUrl: $('meta[property="og:image"]').attr('content') ||
                  $('meta[name="twitter:image"]').attr('content'),
      };

      // Extract main content (remove scripts, styles, nav, footer, etc.)
      $('script, style, nav, footer, header, aside, .ad, .advertisement').remove();
      const content = $('article, main, .content, .post, .entry, body').first().text()
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 10000); // Limit to 10000 chars

      return {
        ...metadata,
        content,
        html,
      };
    } catch (error: any) {
      logger.error({ error, url }, 'Failed to fetch webpage');

      // Provide more specific error messages
      let errorMessage = 'Failed to fetch URL content';

      if (error.code === 'ENOTFOUND') {
        errorMessage = 'URL not found. Please check the URL and try again.';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused. The server is not accepting connections.';
      } else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. The website took too long to respond.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access forbidden. The website is blocking automated requests.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Page not found (404). Please check the URL.';
      } else if (error.response?.status === 500 || error.response?.status === 502 || error.response?.status === 503) {
        errorMessage = `Server error (${error.response.status}). The website is experiencing issues.`;
      } else if (error.response?.status) {
        errorMessage = `HTTP ${error.response.status}: ${error.response.statusText || 'Failed to fetch URL'}`;
      } else if (error.message) {
        errorMessage = `Failed to fetch URL: ${error.message}`;
      }

      throw new HttpException(
        { code: 'FETCH_FAILED', message: errorMessage },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Extract metadata and generate summary using AI
   */
  private async analyzeWithAI(content: string, title: string): Promise<any> {
    if (!this.openai) {
      logger.warn('OpenAI API key not configured, skipping AI analysis');
      return null;
    }

    try {
      const prompt = `Analyze the following webpage content and provide a structured analysis in JSON format.

Title: ${title}
Content: ${content.substring(0, 4000)}

Please provide:
1. summary - A comprehensive 2-3 sentence summary of the main points
2. tags - Array of 3-8 relevant tags/keywords
3. category - Primary category (e.g., "Technology", "Business", "Science", "News", etc.)
4. keyPoints - Array of 3-5 key takeaways
5. sentiment - Overall sentiment (positive, neutral, negative)`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a content analysis assistant. Extract meaningful insights from web content.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      const aiContent = response.choices[0]?.message?.content;
      if (!aiContent) {
        logger.warn('No response from OpenAI');
        return null;
      }

      const analysis = JSON.parse(aiContent);
      logger.info({ analysis }, 'AI analysis completed');
      return analysis;
    } catch (error) {
      logger.error({ error }, 'Failed to analyze with AI');
      return null;
    }
  }

  /**
   * Add URL and fetch/analyze content
   */
  async addUrl(userId: string, addUrlDto: AddUrlDto): Promise<any> {
    try {
      // Debug logging
      logger.info({ userId, userIdType: typeof userId, addUrlDto }, 'addUrl called with parameters');

      // Normalize URL
      const normalizedUrl = this.normalizeUrl(addUrlDto.url);
      const urlHash = this.calculateSHA256(normalizedUrl);

      // Debug logging before query
      logger.info({ userId, urlHash, userIdType: typeof userId }, 'About to check for duplicate');

      // Check for duplicate using findFirst instead of findUnique
      const existingUrlPage = await this.prisma.urlPage.findFirst({
        where: {
          userId: userId,
          urlHash: urlHash,
        },
      });

      if (existingUrlPage) {
        logger.info({ userId, urlHash, urlPageId: existingUrlPage.id }, 'Duplicate URL detected');
        return {
          ...existingUrlPage,
          isDuplicate: true,
          message: 'URL already exists',
        };
      }

      // Try to fetch webpage content
      let pageData: any;
      let fetchFailed = false;
      let fetchError: string | null = null;

      try {
        pageData = await this.fetchWebpage(normalizedUrl);
      } catch (error: any) {
        // If fetch fails (403, timeout, etc.), use fallback minimal data
        fetchFailed = true;
        fetchError = error.response?.data?.message || error.message || 'Failed to fetch content';

        logger.warn({ userId, url: normalizedUrl, error: fetchError }, 'Failed to fetch webpage, using fallback');

        // Extract domain name from URL for title
        const urlObj = new URL(normalizedUrl);
        const domain = urlObj.hostname.replace(/^www\./, '');

        pageData = {
          title: domain,
          description: null,
          author: null,
          publishedAt: null,
          siteName: domain,
          imageUrl: null,
          content: '',
          html: '',
        };
      }

      // Try to analyze with AI (only if we have content)
      let aiAnalysis = null;
      if (!fetchFailed && pageData.content) {
        aiAnalysis = await this.analyzeWithAI(pageData.content, pageData.title);
      }

      // Prepare summary (use AI summary if available, otherwise use description)
      const summary = aiAnalysis?.summary || pageData.description;

      // Parse published date
      let publishedAt: Date | null = null;
      if (pageData.publishedAt) {
        try {
          publishedAt = new Date(pageData.publishedAt);
        } catch (e) {
          logger.warn({ publishedAt: pageData.publishedAt }, 'Failed to parse published date');
        }
      }

      // Create URL page record
      const urlPage = await this.prisma.urlPage.create({
        data: {
          userId,
          url: normalizedUrl,
          urlHash,
          title: pageData.title,
          description: pageData.description,
          summary,
          content: pageData.content,
          author: pageData.author,
          publishedAt,
          siteName: pageData.siteName,
          imageUrl: pageData.imageUrl,
          tags: aiAnalysis?.tags || null,
          metadata: aiAnalysis ? {
            category: aiAnalysis.category,
            keyPoints: aiAnalysis.keyPoints,
            sentiment: aiAnalysis.sentiment,
          } : null,
        },
      });

      logger.info({ userId, urlPageId: urlPage.id, urlHash, fetchFailed }, 'URL page created successfully');

      return {
        ...urlPage,
        aiAnalysis,
        isDuplicate: false,
        fetchFailed,
        fetchError,
        message: fetchFailed
          ? 'URL saved (content could not be fetched - website may be blocking automated requests)'
          : 'URL analyzed successfully',
      };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to add URL');
      throw error;
    }
  }

  /**
   * Get all URL pages for a user
   */
  async getUserUrlPages(userId: string, skip = 0, take = 20): Promise<any[]> {
    return this.prisma.urlPage.findMany({
      where: { userId },
      include: {
        memoryLinks: {
          include: {
            memory: {
              select: {
                id: true,
                title: true,
                body: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  /**
   * Get a specific URL page by ID
   */
  async getUrlPageById(userId: string, urlPageId: string): Promise<any> {
    const urlPage = await this.prisma.urlPage.findFirst({
      where: {
        id: urlPageId,
        userId,
      },
      include: {
        memoryLinks: {
          include: {
            memory: {
              select: {
                id: true,
                title: true,
                body: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!urlPage) {
      throw new HttpException('URL page not found', HttpStatus.NOT_FOUND);
    }

    return urlPage;
  }

  /**
   * Link a URL page to a memory
   */
  async linkUrlPageToMemory(userId: string, urlPageId: string, memoryId: string): Promise<any> {
    // Verify URL page belongs to user
    const urlPage = await this.prisma.urlPage.findFirst({
      where: {
        id: urlPageId,
        userId,
      },
    });

    if (!urlPage) {
      throw new HttpException('URL page not found', HttpStatus.NOT_FOUND);
    }

    // Verify memory belongs to user
    const memory = await this.prisma.memory.findFirst({
      where: {
        id: memoryId,
        userId,
      },
    });

    if (!memory) {
      throw new HttpException('Memory not found', HttpStatus.NOT_FOUND);
    }

    // Check if link already exists
    const existingLink = await this.prisma.memoryUrlPageLink.findUnique({
      where: {
        memoryId_urlPageId: {
          memoryId,
          urlPageId,
        },
      },
    });

    if (existingLink) {
      return {
        message: 'URL page already linked to this memory',
        link: existingLink,
      };
    }

    // Create link
    const link = await this.prisma.memoryUrlPageLink.create({
      data: {
        memoryId,
        urlPageId,
      },
      include: {
        urlPage: true,
        memory: {
          select: {
            id: true,
            title: true,
            body: true,
          },
        },
      },
    });

    logger.info({ userId, memoryId, urlPageId }, 'URL page linked to memory');

    return {
      message: 'URL page linked successfully',
      link,
    };
  }

  /**
   * Link multiple URL pages to a memory
   */
  async linkUrlPagesToMemory(userId: string, memoryId: string, urlPageIds: string[]): Promise<any> {
    // Verify memory belongs to user
    const memory = await this.prisma.memory.findFirst({
      where: {
        id: memoryId,
        userId,
      },
    });

    if (!memory) {
      throw new HttpException('Memory not found', HttpStatus.NOT_FOUND);
    }

    const linked: string[] = [];
    const skipped: string[] = [];

    for (const urlPageId of urlPageIds) {
      // Verify URL page belongs to user
      const urlPage = await this.prisma.urlPage.findFirst({
        where: {
          id: urlPageId,
          userId,
        },
      });

      if (!urlPage) {
        skipped.push(urlPageId);
        continue;
      }

      // Check if link already exists
      const existingLink = await this.prisma.memoryUrlPageLink.findUnique({
        where: {
          memoryId_urlPageId: {
            memoryId,
            urlPageId,
          },
        },
      });

      if (existingLink) {
        skipped.push(urlPageId);
        continue;
      }

      // Create link
      await this.prisma.memoryUrlPageLink.create({
        data: {
          memoryId,
          urlPageId,
        },
      });

      linked.push(urlPageId);
    }

    logger.info({ userId, memoryId, linked: linked.length, skipped: skipped.length }, 'URL pages linked to memory');

    return {
      linked,
      skipped,
      message: `Linked ${linked.length} URL page(s), skipped ${skipped.length}`,
    };
  }

  /**
   * Delete a URL page
   */
  async deleteUrlPage(userId: string, urlPageId: string): Promise<void> {
    const urlPage = await this.prisma.urlPage.findFirst({
      where: {
        id: urlPageId,
        userId,
      },
    });

    if (!urlPage) {
      throw new HttpException('URL page not found', HttpStatus.NOT_FOUND);
    }

    // Delete URL page and all related records (cascade will handle links)
    await this.prisma.urlPage.delete({
      where: { id: urlPageId },
    });

    logger.info({ userId, urlPageId }, 'URL page deleted');
  }
}
