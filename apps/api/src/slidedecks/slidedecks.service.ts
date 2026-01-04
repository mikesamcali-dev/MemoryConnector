import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSlideDeckDto } from './dto/create-slidedeck.dto';
import { UpdateSlideDeckDto } from './dto/update-slidedeck.dto';

@Injectable()
export class SlideDecksService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new slide deck from overdue reminders
   * Finds all reminders where scheduledAt < now and status='pending'
   * Deduplicates by memoryId (keeps oldest reminder per memory)
   * Creates slidedeck with slides and updates reminder status to 'slide'
   */
  async createFromOverdueReminders(
    userId: string,
    dto?: CreateSlideDeckDto,
  ): Promise<any> {
    const now = new Date();

    // Find all overdue reminders
    const overdueReminders = await this.prisma.reminder.findMany({
      where: {
        userId,
        status: 'pending',
        scheduledAt: {
          lt: now,
        },
        dismissedAt: null,
      },
      orderBy: {
        scheduledAt: 'asc', // Oldest first
      },
      include: {
        memory: {
          select: {
            id: true,
            title: true,
            body: true,
          },
        },
      },
    });

    if (overdueReminders.length === 0) {
      throw new BadRequestException('No overdue reminders found');
    }

    // Deduplicate by memoryId - keep oldest reminder for each memory
    const remindersByMemory = new Map<string, any>();
    overdueReminders.forEach((reminder) => {
      const existing = remindersByMemory.get(reminder.memoryId);
      if (!existing || reminder.scheduledAt < existing.scheduledAt) {
        remindersByMemory.set(reminder.memoryId, reminder);
      }
    });

    const uniqueReminders = Array.from(remindersByMemory.values());

    // Create slide deck with slides in a transaction
    const slideDeck = await this.prisma.$transaction(async (tx) => {
      // Create the slide deck
      const deck = await tx.slideDeck.create({
        data: {
          userId,
          title: dto?.title,
        },
      });

      // Create slides
      await Promise.all(
        uniqueReminders.map((reminder, index) =>
          tx.slide.create({
            data: {
              slideDeckId: deck.id,
              reminderId: reminder.id,
              memoryId: reminder.memoryId,
              sortOrder: index,
            },
          }),
        ),
      );

      // Update reminder statuses to 'slide'
      await tx.reminder.updateMany({
        where: {
          id: {
            in: uniqueReminders.map((r) => r.id),
          },
        },
        data: {
          status: 'slide',
        },
      });

      return deck;
    });

    // Return deck with slide count
    return {
      ...slideDeck,
      slideCount: uniqueReminders.length,
    };
  }

  /**
   * Get all slide decks for a user
   */
  async findAll(userId: string): Promise<any[]> {
    const slideDecks = await this.prisma.slideDeck.findMany({
      where: {
        userId,
      },
      include: {
        _count: {
          select: {
            slides: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return slideDecks.map((deck) => ({
      ...deck,
      slideCount: deck._count.slides,
      _count: undefined,
    }));
  }

  /**
   * Get a specific slide deck
   */
  async findOne(userId: string, slideDeckId: string): Promise<any> {
    const slideDeck = await this.prisma.slideDeck.findFirst({
      where: {
        id: slideDeckId,
        userId,
      },
      include: {
        _count: {
          select: {
            slides: true,
          },
        },
      },
    });

    if (!slideDeck) {
      throw new NotFoundException('Slide deck not found');
    }

    return {
      ...slideDeck,
      slideCount: slideDeck._count.slides,
      _count: undefined,
    };
  }

  /**
   * Get all slides for a deck with complete memory data
   */
  async getSlides(userId: string, slideDeckId: string): Promise<any[]> {
    // Verify deck ownership
    const slideDeck = await this.prisma.slideDeck.findFirst({
      where: {
        id: slideDeckId,
        userId,
      },
    });

    if (!slideDeck) {
      throw new NotFoundException('Slide deck not found');
    }

    // Get slides with full memory data
    const slides = await this.prisma.slide.findMany({
      where: {
        slideDeckId,
      },
      orderBy: {
        sortOrder: 'asc',
      },
      include: {
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
      },
    });

    return slides;
  }

  /**
   * Update a slide deck
   */
  async update(
    userId: string,
    slideDeckId: string,
    dto: UpdateSlideDeckDto,
  ): Promise<any> {
    // Verify deck ownership
    const existingDeck = await this.prisma.slideDeck.findFirst({
      where: {
        id: slideDeckId,
        userId,
      },
    });

    if (!existingDeck) {
      throw new NotFoundException('Slide deck not found');
    }

    // Update the deck
    const updatedDeck = await this.prisma.slideDeck.update({
      where: {
        id: slideDeckId,
      },
      data: {
        title: dto.title,
      },
      include: {
        _count: {
          select: {
            slides: true,
          },
        },
      },
    });

    return {
      ...updatedDeck,
      slideCount: updatedDeck._count.slides,
      _count: undefined,
    };
  }

  /**
   * Delete a slide deck
   * Cascades to slides, reminders remain with status='slide'
   */
  async delete(userId: string, slideDeckId: string): Promise<void> {
    // Verify deck ownership
    const slideDeck = await this.prisma.slideDeck.findFirst({
      where: {
        id: slideDeckId,
        userId,
      },
    });

    if (!slideDeck) {
      throw new NotFoundException('Slide deck not found');
    }

    // Delete will cascade to slides
    await this.prisma.slideDeck.delete({
      where: {
        id: slideDeckId,
      },
    });
  }
}
