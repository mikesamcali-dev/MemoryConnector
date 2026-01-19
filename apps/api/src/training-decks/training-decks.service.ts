import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrainingDeckDto } from './dto/create-training-deck.dto';
import { UpdateTrainingDeckDto } from './dto/update-training-deck.dto';

@Injectable()
export class TrainingDecksService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create the current (active) training deck for a training
   */
  async getOrCreateCurrentDeck(userId: string, trainingId: string): Promise<any> {
    // Verify training ownership
    const training = await this.prisma.training.findFirst({
      where: { id: trainingId, userId },
    });

    if (!training) {
      throw new NotFoundException('Training not found');
    }

    // Check if a deck already exists for this training
    const existingDeck = await this.prisma.trainingDeck.findFirst({
      where: { userId, trainingId },
      orderBy: { createdAt: 'desc' },
    });

    if (existingDeck) {
      return existingDeck;
    }

    // Create new deck with training name as title
    return this.prisma.trainingDeck.create({
      data: {
        userId,
        trainingId,
        title: training.name,
      },
    });
  }

  /**
   * Add a memory to a training's current deck
   */
  async addMemoryToTrainingDeck(
    userId: string,
    trainingId: string,
    memoryId: string,
  ): Promise<void> {
    // Get or create current deck for this training
    const deck = await this.getOrCreateCurrentDeck(userId, trainingId);

    // Check if memory is already in the deck
    const existing = await this.prisma.trainingLesson.findFirst({
      where: { trainingDeckId: deck.id, memoryId },
    });

    if (existing) return; // Already added

    // Get next sort order
    const maxOrder = await this.prisma.trainingLesson.findFirst({
      where: { trainingDeckId: deck.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const nextOrder = (maxOrder?.sortOrder ?? -1) + 1;

    // Add memory as a lesson to the deck
    await this.prisma.trainingLesson.create({
      data: {
        trainingDeckId: deck.id,
        memoryId,
        sortOrder: nextOrder,
      },
    });
  }

  /**
   * Create a new training deck from a training's linked content
   * Auto-populates lessons from all linked content in order:
   * 1. Memories (by createdAt)
   * 2. Images (by createdAt)
   * 3. YouTube Videos (by createdAt)
   * 4. TikTok Videos (by createdAt)
   * 5. URL Pages (by createdAt)
   */
  async createFromTraining(
    userId: string,
    dto: CreateTrainingDeckDto,
  ): Promise<any> {
    // Verify training ownership
    const training = await this.prisma.training.findFirst({
      where: {
        id: dto.trainingId,
        userId,
      },
      include: {
        memoryLinks: {
          include: {
            memory: {
              select: {
                id: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        imageLinks: {
          include: {
            image: {
              select: {
                id: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        youtubeVideoLinks: {
          include: {
            youtubeVideo: {
              select: {
                id: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        tiktokVideoLinks: {
          include: {
            tiktokVideo: {
              select: {
                id: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        urlPageLinks: {
          include: {
            urlPage: {
              select: {
                id: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!training) {
      throw new NotFoundException('Training not found or you do not have permission to access it');
    }

    // Check if training has any content
    const hasContent =
      training.memoryLinks.length > 0 ||
      training.imageLinks.length > 0 ||
      training.youtubeVideoLinks.length > 0 ||
      training.tiktokVideoLinks.length > 0 ||
      training.urlPageLinks.length > 0;

    if (!hasContent) {
      throw new BadRequestException('Training has no linked content');
    }

    // Create training deck with lessons in a transaction
    const trainingDeck = await this.prisma.$transaction(async (tx) => {
      // Create the training deck
      const deck = await tx.trainingDeck.create({
        data: {
          userId,
          trainingId: dto.trainingId,
          title: dto.title,
        },
      });

      let sortOrder = 0;

      // Create lessons for memories
      await Promise.all(
        training.memoryLinks.map((link) =>
          tx.trainingLesson.create({
            data: {
              trainingDeckId: deck.id,
              memoryId: link.memory.id,
              sortOrder: sortOrder++,
            },
          }),
        ),
      );

      // Create lessons for images
      await Promise.all(
        training.imageLinks.map((link) =>
          tx.trainingLesson.create({
            data: {
              trainingDeckId: deck.id,
              imageId: link.image.id,
              sortOrder: sortOrder++,
            },
          }),
        ),
      );

      // Create lessons for YouTube videos
      await Promise.all(
        training.youtubeVideoLinks.map((link) =>
          tx.trainingLesson.create({
            data: {
              trainingDeckId: deck.id,
              youtubeVideoId: link.youtubeVideo.id,
              sortOrder: sortOrder++,
            },
          }),
        ),
      );

      // Create lessons for TikTok videos
      await Promise.all(
        training.tiktokVideoLinks.map((link) =>
          tx.trainingLesson.create({
            data: {
              trainingDeckId: deck.id,
              tiktokVideoId: link.tiktokVideo.id,
              sortOrder: sortOrder++,
            },
          }),
        ),
      );

      // Create lessons for URL pages
      await Promise.all(
        training.urlPageLinks.map((link) =>
          tx.trainingLesson.create({
            data: {
              trainingDeckId: deck.id,
              urlPageId: link.urlPage.id,
              sortOrder: sortOrder++,
            },
          }),
        ),
      );

      return deck;
    });

    // Calculate total lesson count
    const lessonCount =
      training.memoryLinks.length +
      training.imageLinks.length +
      training.youtubeVideoLinks.length +
      training.tiktokVideoLinks.length +
      training.urlPageLinks.length;

    // Return deck with lesson count
    return {
      ...trainingDeck,
      lessonCount,
    };
  }

  /**
   * Get all training decks for a user
   */
  async findAll(userId: string): Promise<any[]> {
    const trainingDecks = await this.prisma.trainingDeck.findMany({
      where: {
        userId,
      },
      include: {
        training: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            trainingLessons: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return trainingDecks.map((deck) => ({
      ...deck,
      lessonCount: deck._count.trainingLessons,
      _count: undefined,
    }));
  }

  /**
   * Get a specific training deck
   */
  async findOne(userId: string, trainingDeckId: string): Promise<any> {
    const trainingDeck = await this.prisma.trainingDeck.findFirst({
      where: {
        id: trainingDeckId,
        userId,
      },
      include: {
        training: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            trainingLessons: true,
          },
        },
      },
    });

    if (!trainingDeck) {
      throw new NotFoundException('Training deck not found');
    }

    return {
      ...trainingDeck,
      lessonCount: trainingDeck._count.trainingLessons,
      _count: undefined,
    };
  }

  /**
   * Get all lessons for a deck with complete polymorphic data
   */
  async getLessons(userId: string, trainingDeckId: string): Promise<any[]> {
    // Verify deck ownership
    const trainingDeck = await this.prisma.trainingDeck.findFirst({
      where: {
        id: trainingDeckId,
        userId,
      },
    });

    if (!trainingDeck) {
      throw new NotFoundException('Training deck not found');
    }

    // Get lessons with full polymorphic data
    const lessons = await this.prisma.trainingLesson.findMany({
      where: {
        trainingDeckId,
      },
      orderBy: {
        sortOrder: 'asc',
      },
      include: {
        // Polymorphic content relations
        memory: {
          include: {
            // Shared entity relations
            event: true,
            location: true,
            person: true,
            youtubeVideo: true,
            tiktokVideo: true,

            // Many-to-many relations
            wordLinks: {
              include: {
                word: true,
              },
            },
            imageLinks: {
              include: {
                image: true,
              },
            },
            urlPageLinks: {
              include: {
                urlPage: true,
              },
            },
          },
        },
        image: true,
        urlPage: true,
        youtubeVideo: true,
        tiktokVideo: true,
      },
    });

    return lessons;
  }

  /**
   * Update a training deck
   */
  async update(
    userId: string,
    trainingDeckId: string,
    dto: UpdateTrainingDeckDto,
  ): Promise<any> {
    // Verify deck ownership
    const existingDeck = await this.prisma.trainingDeck.findFirst({
      where: {
        id: trainingDeckId,
        userId,
      },
    });

    if (!existingDeck) {
      throw new NotFoundException('Training deck not found');
    }

    // Update the deck
    const updatedDeck = await this.prisma.trainingDeck.update({
      where: {
        id: trainingDeckId,
      },
      data: {
        title: dto.title,
      },
      include: {
        training: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            trainingLessons: true,
          },
        },
      },
    });

    return {
      ...updatedDeck,
      lessonCount: updatedDeck._count.trainingLessons,
      _count: undefined,
    };
  }

  /**
   * Delete a training deck
   * Cascades to training lessons
   */
  async delete(userId: string, trainingDeckId: string): Promise<void> {
    // Verify deck ownership
    const trainingDeck = await this.prisma.trainingDeck.findFirst({
      where: {
        id: trainingDeckId,
        userId,
      },
    });

    if (!trainingDeck) {
      throw new NotFoundException('Training deck not found');
    }

    // Delete will cascade to training lessons
    await this.prisma.trainingDeck.delete({
      where: {
        id: trainingDeckId,
      },
    });
  }

  /**
   * Delete a specific training lesson from a deck
   * Validates deck ownership
   */
  async deleteLesson(
    userId: string,
    trainingDeckId: string,
    lessonId: string,
  ): Promise<void> {
    // Verify deck ownership
    const trainingDeck = await this.prisma.trainingDeck.findFirst({
      where: {
        id: trainingDeckId,
        userId,
      },
    });

    if (!trainingDeck) {
      throw new NotFoundException('Training deck not found');
    }

    // Verify lesson belongs to this deck
    const lesson = await this.prisma.trainingLesson.findFirst({
      where: {
        id: lessonId,
        trainingDeckId,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Training lesson not found in this deck');
    }

    // Delete the lesson
    await this.prisma.trainingLesson.delete({
      where: {
        id: lessonId,
      },
    });
  }
}
