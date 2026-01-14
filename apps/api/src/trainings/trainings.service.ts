import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';

@Injectable()
export class TrainingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new training for a user
   */
  async create(userId: string, dto: CreateTrainingDto) {
    return this.prisma.training.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description || null,
        tags: dto.tags || [],
      },
      include: {
        _count: {
          select: { memoryLinks: true },
        },
      },
    });
  }

  /**
   * Get all trainings for a user with content counts
   */
  async findAllByUser(userId: string) {
    return this.prisma.training.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            memoryLinks: true,
            imageLinks: true,
            urlPageLinks: true,
            youtubeVideoLinks: true,
            tiktokVideoLinks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single training by ID with all linked content
   * Validates ownership
   */
  async findById(id: string, userId: string) {
    const training = await this.prisma.training.findFirst({
      where: { id, userId },
      include: {
        memoryLinks: {
          include: {
            memory: {
              select: {
                id: true,
                body: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 100, // Limit to 100 most recent memories
        },
        imageLinks: {
          include: {
            image: {
              select: {
                id: true,
                storageUrl: true,
                thumbnailUrl256: true,
                thumbnailUrl1024: true,
                contentType: true,
                capturedAt: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        urlPageLinks: {
          include: {
            urlPage: {
              select: {
                id: true,
                url: true,
                title: true,
                description: true,
                imageUrl: true,
                siteName: true,
                author: true,
                publishedAt: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        youtubeVideoLinks: {
          include: {
            youtubeVideo: {
              select: {
                id: true,
                youtubeVideoId: true,
                title: true,
                description: true,
                thumbnailUrl: true,
                creatorDisplayName: true,
                publishedAt: true,
                durationSeconds: true,
                viewCount: true,
                likeCount: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        tiktokVideoLinks: {
          include: {
            tiktokVideo: {
              select: {
                id: true,
                tiktokVideoId: true,
                title: true,
                description: true,
                thumbnailUrl: true,
                creatorDisplayName: true,
                creatorUsername: true,
                publishedAt: true,
                durationSeconds: true,
                viewCount: true,
                likeCount: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        _count: {
          select: {
            memoryLinks: true,
            imageLinks: true,
            urlPageLinks: true,
            youtubeVideoLinks: true,
            tiktokVideoLinks: true,
          },
        },
      },
    });

    if (!training) {
      throw new HttpException(
        'Training not found or you do not have permission to view it',
        HttpStatus.NOT_FOUND,
      );
    }

    return training;
  }

  /**
   * Update a training
   * Validates ownership
   */
  async update(id: string, userId: string, dto: UpdateTrainingDto) {
    // Verify ownership
    const training = await this.prisma.training.findFirst({
      where: { id, userId },
    });

    if (!training) {
      throw new HttpException(
        'Training not found or you do not have permission to update it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Update training
    return this.prisma.training.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        tags: dto.tags,
      },
      include: {
        _count: {
          select: {
            memoryLinks: true,
            imageLinks: true,
            urlPageLinks: true,
            youtubeVideoLinks: true,
            tiktokVideoLinks: true,
          },
        },
      },
    });
  }

  /**
   * Delete a training
   * Validates ownership
   * Cascading deletes will remove all links and training decks
   */
  async delete(id: string, userId: string) {
    // Verify ownership
    const training = await this.prisma.training.findFirst({
      where: { id, userId },
    });

    if (!training) {
      throw new HttpException(
        'Training not found or you do not have permission to delete it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Delete training (cascade will remove links and decks)
    await this.prisma.training.delete({
      where: { id },
    });

    return { success: true, message: 'Training deleted successfully' };
  }

  /**
   * Link a memory to a training
   * Validates ownership of both memory and training
   */
  async linkMemoryToTraining(
    memoryId: string,
    trainingId: string,
    userId: string,
  ) {
    // Verify memory ownership
    const memory = await this.prisma.memory.findFirst({
      where: { id: memoryId, userId },
    });

    if (!memory) {
      throw new HttpException(
        'Memory not found or you do not have permission to link it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Verify training ownership
    const training = await this.prisma.training.findFirst({
      where: { id: trainingId, userId },
    });

    if (!training) {
      throw new HttpException(
        'Training not found or you do not have permission to link to it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if link already exists
    const existingLink = await this.prisma.memoryTrainingLink.findUnique({
      where: {
        memoryId_trainingId: {
          memoryId,
          trainingId,
        },
      },
    });

    if (existingLink) {
      throw new HttpException(
        'Memory is already linked to this training',
        HttpStatus.CONFLICT,
      );
    }

    // Create link
    const link = await this.prisma.memoryTrainingLink.create({
      data: {
        memoryId,
        trainingId,
      },
      include: {
        memory: {
          select: {
            id: true,
            body: true,
            createdAt: true,
          },
        },
        training: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return link;
  }

  /**
   * Unlink a memory from a training
   * Validates ownership
   */
  async unlinkMemoryFromTraining(
    memoryId: string,
    trainingId: string,
    userId: string,
  ) {
    // Verify ownership of both entities
    const memory = await this.prisma.memory.findFirst({
      where: { id: memoryId, userId },
    });

    if (!memory) {
      throw new HttpException(
        'Memory not found or you do not have permission to unlink it',
        HttpStatus.NOT_FOUND,
      );
    }

    const training = await this.prisma.training.findFirst({
      where: { id: trainingId, userId },
    });

    if (!training) {
      throw new HttpException(
        'Training not found or you do not have permission to unlink from it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Find the link
    const link = await this.prisma.memoryTrainingLink.findUnique({
      where: {
        memoryId_trainingId: {
          memoryId,
          trainingId,
        },
      },
    });

    if (!link) {
      throw new HttpException(
        'Link not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Delete the link
    await this.prisma.memoryTrainingLink.delete({
      where: {
        id: link.id,
      },
    });

    return { success: true, message: 'Memory unlinked from training successfully' };
  }

  /**
   * Link an image to a training
   * Validates ownership of both image and training
   */
  async linkImageToTraining(
    imageId: string,
    trainingId: string,
    userId: string,
  ) {
    // Verify image ownership
    const image = await this.prisma.image.findFirst({
      where: { id: imageId, userId },
    });

    if (!image) {
      throw new HttpException(
        'Image not found or you do not have permission to link it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Verify training ownership
    const training = await this.prisma.training.findFirst({
      where: { id: trainingId, userId },
    });

    if (!training) {
      throw new HttpException(
        'Training not found or you do not have permission to link to it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if link already exists
    const existingLink = await this.prisma.trainingImageLink.findUnique({
      where: {
        trainingId_imageId: {
          trainingId,
          imageId,
        },
      },
    });

    if (existingLink) {
      throw new HttpException(
        'Image is already linked to this training',
        HttpStatus.CONFLICT,
      );
    }

    // Create link
    const link = await this.prisma.trainingImageLink.create({
      data: {
        trainingId,
        imageId,
      },
    });

    return link;
  }

  /**
   * Unlink an image from a training
   * Validates ownership
   */
  async unlinkImageFromTraining(
    imageId: string,
    trainingId: string,
    userId: string,
  ) {
    // Verify ownership of both entities
    const image = await this.prisma.image.findFirst({
      where: { id: imageId, userId },
    });

    if (!image) {
      throw new HttpException(
        'Image not found or you do not have permission to unlink it',
        HttpStatus.NOT_FOUND,
      );
    }

    const training = await this.prisma.training.findFirst({
      where: { id: trainingId, userId },
    });

    if (!training) {
      throw new HttpException(
        'Training not found or you do not have permission to unlink from it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Find the link
    const link = await this.prisma.trainingImageLink.findUnique({
      where: {
        trainingId_imageId: {
          trainingId,
          imageId,
        },
      },
    });

    if (!link) {
      throw new HttpException(
        'Link not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Delete the link
    await this.prisma.trainingImageLink.delete({
      where: {
        id: link.id,
      },
    });

    return { success: true, message: 'Image unlinked from training successfully' };
  }

  /**
   * Link a URL page to a training
   * Validates ownership of both URL page and training
   */
  async linkUrlPageToTraining(
    urlPageId: string,
    trainingId: string,
    userId: string,
  ) {
    // Verify URL page ownership
    const urlPage = await this.prisma.urlPage.findFirst({
      where: { id: urlPageId, userId },
    });

    if (!urlPage) {
      throw new HttpException(
        'URL page not found or you do not have permission to link it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Verify training ownership
    const training = await this.prisma.training.findFirst({
      where: { id: trainingId, userId },
    });

    if (!training) {
      throw new HttpException(
        'Training not found or you do not have permission to link to it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if link already exists
    const existingLink = await this.prisma.trainingUrlPageLink.findUnique({
      where: {
        trainingId_urlPageId: {
          trainingId,
          urlPageId,
        },
      },
    });

    if (existingLink) {
      throw new HttpException(
        'URL page is already linked to this training',
        HttpStatus.CONFLICT,
      );
    }

    // Create link
    const link = await this.prisma.trainingUrlPageLink.create({
      data: {
        trainingId,
        urlPageId,
      },
    });

    return link;
  }

  /**
   * Unlink a URL page from a training
   * Validates ownership
   */
  async unlinkUrlPageFromTraining(
    urlPageId: string,
    trainingId: string,
    userId: string,
  ) {
    // Verify ownership of both entities
    const urlPage = await this.prisma.urlPage.findFirst({
      where: { id: urlPageId, userId },
    });

    if (!urlPage) {
      throw new HttpException(
        'URL page not found or you do not have permission to unlink it',
        HttpStatus.NOT_FOUND,
      );
    }

    const training = await this.prisma.training.findFirst({
      where: { id: trainingId, userId },
    });

    if (!training) {
      throw new HttpException(
        'Training not found or you do not have permission to unlink from it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Find the link
    const link = await this.prisma.trainingUrlPageLink.findUnique({
      where: {
        trainingId_urlPageId: {
          trainingId,
          urlPageId,
        },
      },
    });

    if (!link) {
      throw new HttpException(
        'Link not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Delete the link
    await this.prisma.trainingUrlPageLink.delete({
      where: {
        id: link.id,
      },
    });

    return { success: true, message: 'URL page unlinked from training successfully' };
  }

  /**
   * Link a YouTube video to a training
   * Validates training ownership and video existence
   */
  async linkYouTubeVideoToTraining(
    youtubeVideoId: string,
    trainingId: string,
    userId: string,
  ) {
    // Verify YouTube video exists
    const youtubeVideo = await this.prisma.youTubeVideo.findUnique({
      where: { id: youtubeVideoId },
    });

    if (!youtubeVideo) {
      throw new HttpException(
        'YouTube video not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Verify training ownership
    const training = await this.prisma.training.findFirst({
      where: { id: trainingId, userId },
    });

    if (!training) {
      throw new HttpException(
        'Training not found or you do not have permission to link to it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if link already exists
    const existingLink = await this.prisma.trainingYouTubeVideoLink.findUnique({
      where: {
        trainingId_youtubeVideoId: {
          trainingId,
          youtubeVideoId,
        },
      },
    });

    if (existingLink) {
      throw new HttpException(
        'YouTube video is already linked to this training',
        HttpStatus.CONFLICT,
      );
    }

    // Create link
    const link = await this.prisma.trainingYouTubeVideoLink.create({
      data: {
        trainingId,
        youtubeVideoId,
      },
    });

    return link;
  }

  /**
   * Unlink a YouTube video from a training
   * Validates ownership
   */
  async unlinkYouTubeVideoFromTraining(
    youtubeVideoId: string,
    trainingId: string,
    userId: string,
  ) {
    // Verify training ownership
    const training = await this.prisma.training.findFirst({
      where: { id: trainingId, userId },
    });

    if (!training) {
      throw new HttpException(
        'Training not found or you do not have permission to unlink from it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Find the link
    const link = await this.prisma.trainingYouTubeVideoLink.findUnique({
      where: {
        trainingId_youtubeVideoId: {
          trainingId,
          youtubeVideoId,
        },
      },
    });

    if (!link) {
      throw new HttpException(
        'Link not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Delete the link
    await this.prisma.trainingYouTubeVideoLink.delete({
      where: {
        id: link.id,
      },
    });

    return { success: true, message: 'YouTube video unlinked from training successfully' };
  }

  /**
   * Link a TikTok video to a training
   * Validates training ownership and video existence
   */
  async linkTikTokVideoToTraining(
    tiktokVideoId: string,
    trainingId: string,
    userId: string,
  ) {
    // Verify TikTok video exists
    const tiktokVideo = await this.prisma.tikTokVideo.findUnique({
      where: { id: tiktokVideoId },
    });

    if (!tiktokVideo) {
      throw new HttpException(
        'TikTok video not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Verify training ownership
    const training = await this.prisma.training.findFirst({
      where: { id: trainingId, userId },
    });

    if (!training) {
      throw new HttpException(
        'Training not found or you do not have permission to link to it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if link already exists
    const existingLink = await this.prisma.trainingTikTokVideoLink.findUnique({
      where: {
        trainingId_tiktokVideoId: {
          trainingId,
          tiktokVideoId,
        },
      },
    });

    if (existingLink) {
      throw new HttpException(
        'TikTok video is already linked to this training',
        HttpStatus.CONFLICT,
      );
    }

    // Create link
    const link = await this.prisma.trainingTikTokVideoLink.create({
      data: {
        trainingId,
        tiktokVideoId,
      },
    });

    return link;
  }

  /**
   * Unlink a TikTok video from a training
   * Validates ownership
   */
  async unlinkTikTokVideoFromTraining(
    tiktokVideoId: string,
    trainingId: string,
    userId: string,
  ) {
    // Verify training ownership
    const training = await this.prisma.training.findFirst({
      where: { id: trainingId, userId },
    });

    if (!training) {
      throw new HttpException(
        'Training not found or you do not have permission to unlink from it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Find the link
    const link = await this.prisma.trainingTikTokVideoLink.findUnique({
      where: {
        trainingId_tiktokVideoId: {
          trainingId,
          tiktokVideoId,
        },
      },
    });

    if (!link) {
      throw new HttpException(
        'Link not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Delete the link
    await this.prisma.trainingTikTokVideoLink.delete({
      where: {
        id: link.id,
      },
    });

    return { success: true, message: 'TikTok video unlinked from training successfully' };
  }

  /**
   * Update lastViewedAt timestamp for a training
   * Validates ownership
   */
  async updateLastViewedAt(id: string, userId: string) {
    // Verify ownership
    const training = await this.prisma.training.findFirst({
      where: { id, userId },
    });

    if (!training) {
      throw new HttpException(
        'Training not found or you do not have permission to update it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Update lastViewedAt
    return this.prisma.training.update({
      where: { id },
      data: {
        lastViewedAt: new Date(),
      },
    });
  }

  /**
   * Create 3 spaced repetition reminders for a training
   * Schedule: 1 day, 3 days, 7 days from now
   * Validates ownership
   */
  async createReminders(id: string, userId: string) {
    // Verify ownership
    const training = await this.prisma.training.findFirst({
      where: { id, userId },
    });

    if (!training) {
      throw new HttpException(
        'Training not found or you do not have permission to create reminders for it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Get first memory or content from the training to create reminders
    const trainingWithContent = await this.prisma.training.findUnique({
      where: { id },
      include: {
        memoryLinks: {
          include: {
            memory: {
              select: { id: true },
            },
          },
          take: 1,
        },
      },
    });

    if (!trainingWithContent?.memoryLinks?.length) {
      throw new HttpException(
        'Training has no linked memories. Cannot create reminders without associated memories.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const memoryId = trainingWithContent.memoryLinks[0].memory.id;

    // Create 3 reminders with SRS schedule (1 day, 3 days, 7 days)
    const now = new Date();
    const schedules = [
      { days: 1, name: '1 day' },
      { days: 3, name: '3 days' },
      { days: 7, name: '7 days' },
    ];

    const reminders = await Promise.all(
      schedules.map((schedule) => {
        const scheduledAt = new Date(now);
        scheduledAt.setDate(scheduledAt.getDate() + schedule.days);

        return this.prisma.reminder.create({
          data: {
            userId,
            memoryId,
            scheduledAt,
            status: 'pending',
          },
        });
      }),
    );

    return {
      success: true,
      message: `Created ${reminders.length} reminders for training`,
      reminders,
    };
  }
}
