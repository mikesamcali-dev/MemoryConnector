import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UploadImageDto } from './dto/upload-image.dto';
import { createHash } from 'crypto';
import { logger } from '../common/logger';
import OpenAI from 'openai';

@Injectable()
export class ImagesService {
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
   * Calculate SHA256 hash of image data
   */
  private calculateSHA256(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Calculate perceptual hash (placeholder - simplified version)
   * For production, use a library like 'sharp' with perceptual hashing
   */
  private calculatePerceptualHash(buffer: Buffer): string {
    // Simplified hash - in production use proper pHash algorithm
    return createHash('md5').update(buffer).digest('hex').substring(0, 16);
  }

  /**
   * Extract metadata from image using OpenAI Vision API
   */
  private async extractMetadataWithAI(base64Image: string, contentType: string): Promise<any> {
    if (!this.openai) {
      logger.warn('OpenAI API key not configured, skipping AI metadata extraction');
      return null;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an image analysis assistant. Analyze the provided image and extract metadata in JSON format. Include: description (detailed description of the image), tags (array of relevant tags), detectedObjects (array of objects/people detected), estimatedLocation (if recognizable landmarks), suggestedCaption (short caption).',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image and provide metadata in JSON format.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${contentType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        logger.warn('No response from OpenAI Vision API');
        return null;
      }

      const metadata = JSON.parse(content);
      logger.info({ metadata }, 'AI metadata extracted successfully');
      return metadata;
    } catch (error) {
      logger.error({ error }, 'Failed to extract metadata with AI');
      return null;
    }
  }

  /**
   * Upload image and create database record
   */
  async uploadImage(userId: string, uploadDto: UploadImageDto): Promise<any> {
    try {
      // Decode base64 image data
      const imageBuffer = Buffer.from(uploadDto.imageData, 'base64');
      const sizeBytes = imageBuffer.length;

      // Validate size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (sizeBytes > maxSize) {
        throw new HttpException(
          { code: 'IMAGE_TOO_LARGE', message: 'Image exceeds maximum size of 50MB' },
          HttpStatus.PAYLOAD_TOO_LARGE,
        );
      }

      // Validate content type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
      if (!allowedTypes.includes(uploadDto.contentType)) {
        throw new HttpException(
          { code: 'INVALID_IMAGE', message: 'Unsupported image format' },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Calculate hashes
      const sha256 = this.calculateSHA256(imageBuffer);
      const phash = this.calculatePerceptualHash(imageBuffer);

      // Check for duplicate (exact match by SHA256)
      const existingImage = await this.prisma.image.findUnique({
        where: {
          userId_sha256: {
            userId,
            sha256,
          },
        },
      });

      if (existingImage) {
        logger.info({ userId, sha256, imageId: existingImage.id }, 'Duplicate image detected');
        return {
          ...existingImage,
          isDuplicate: true,
          message: 'Image already exists',
        };
      }

      // For MVP: Store image data as base64 in storage_url (temporary solution)
      // TODO: Upload to Cloudflare R2 in production
      const storageUrl = `data:${uploadDto.contentType};base64,${uploadDto.imageData}`;
      const storageKey = `${userId}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${sha256}`;

      // Extract metadata using AI
      const aiMetadata = await this.extractMetadataWithAI(uploadDto.imageData, uploadDto.contentType);

      // Extract EXIF data (placeholder - would use exif-parser or similar library)
      const exifData = null;

      // Create image record
      const image = await this.prisma.image.create({
        data: {
          userId,
          storageUrl,
          storageKey,
          contentType: uploadDto.contentType,
          sizeBytes,
          sha256,
          phash,
          capturedAt: uploadDto.capturedAt ? new Date(uploadDto.capturedAt) : null,
          latitude: uploadDto.latitude,
          longitude: uploadDto.longitude,
          locationAccuracy: uploadDto.locationAccuracy,
          locationSource: uploadDto.locationSource,
          consentBiometrics: uploadDto.consentBiometrics || false,
          exifData,
        },
      });

      logger.info({ userId, imageId: image.id, sha256 }, 'Image uploaded successfully');

      return {
        ...image,
        aiMetadata,
        isDuplicate: false,
        message: 'Image uploaded successfully',
      };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to upload image');
      throw error;
    }
  }

  /**
   * Get all images for a user
   */
  async getUserImages(userId: string, skip = 0, take = 20): Promise<any[]> {
    return this.prisma.image.findMany({
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
        faces: true,
        personLinks: {
          include: {
            person: {
              select: {
                id: true,
                displayName: true,
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
   * Get a specific image by ID
   */
  async getImageById(userId: string, imageId: string): Promise<any> {
    const image = await this.prisma.image.findFirst({
      where: {
        id: imageId,
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
        faces: true,
        personLinks: {
          include: {
            person: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!image) {
      throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
    }

    return image;
  }

  /**
   * Link an image to a memory
   */
  async linkImageToMemory(userId: string, imageId: string, memoryId: string): Promise<any> {
    // Verify image belongs to user
    const image = await this.prisma.image.findFirst({
      where: {
        id: imageId,
        userId,
      },
    });

    if (!image) {
      throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
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
    const existingLink = await this.prisma.memoryImageLink.findUnique({
      where: {
        memoryId_imageId: {
          memoryId,
          imageId,
        },
      },
    });

    if (existingLink) {
      return {
        message: 'Image already linked to this memory',
        link: existingLink,
      };
    }

    // Create link
    const link = await this.prisma.memoryImageLink.create({
      data: {
        memoryId,
        imageId,
      },
      include: {
        image: true,
        memory: {
          select: {
            id: true,
            title: true,
            body: true,
          },
        },
      },
    });

    logger.info({ userId, memoryId, imageId }, 'Image linked to memory');

    return {
      message: 'Image linked successfully',
      link,
    };
  }

  /**
   * Link multiple images to a memory
   */
  async linkImagesToMemory(userId: string, memoryId: string, imageIds: string[]): Promise<any> {
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

    for (const imageId of imageIds) {
      // Verify image belongs to user
      const image = await this.prisma.image.findFirst({
        where: {
          id: imageId,
          userId,
        },
      });

      if (!image) {
        skipped.push(imageId);
        continue;
      }

      // Check if link already exists
      const existingLink = await this.prisma.memoryImageLink.findUnique({
        where: {
          memoryId_imageId: {
            memoryId,
            imageId,
          },
        },
      });

      if (existingLink) {
        skipped.push(imageId);
        continue;
      }

      // Create link
      await this.prisma.memoryImageLink.create({
        data: {
          memoryId,
          imageId,
        },
      });

      linked.push(imageId);
    }

    logger.info({ userId, memoryId, linked: linked.length, skipped: skipped.length }, 'Images linked to memory');

    return {
      linked,
      skipped,
      message: `Linked ${linked.length} image(s), skipped ${skipped.length}`,
    };
  }

  /**
   * Delete an image (soft delete by removing from user's access)
   */
  async deleteImage(userId: string, imageId: string): Promise<void> {
    const image = await this.prisma.image.findFirst({
      where: {
        id: imageId,
        userId,
      },
    });

    if (!image) {
      throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
    }

    // Delete image and all related records (cascade will handle links)
    await this.prisma.image.delete({
      where: { id: imageId },
    });

    logger.info({ userId, imageId }, 'Image deleted');
  }
}
