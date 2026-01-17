import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemoryDeckDto } from './dto/create-memory-deck.dto';
import { UpdateMemoryDeckDto } from './dto/update-memory-deck.dto';
import { format, startOfWeek } from 'date-fns';

@Injectable()
export class MemoryDecksService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get current (non-archived) deck for user
   */
  async getCurrentDeck(userId: string): Promise<any | null> {
    return this.prisma.memoryDeck.findFirst({
      where: { userId, isArchived: false },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });
  }

  /**
   * Get or create current deck
   */
  async getOrCreateCurrentDeck(userId: string): Promise<any> {
    const existing = await this.getCurrentDeck(userId);
    if (existing) return existing;

    // Create new empty deck
    return this.prisma.memoryDeck.create({
      data: {
        userId,
        title: `Week of ${format(new Date(), 'MMM d, yyyy')}`,
        autoCreated: false,
        isArchived: false,
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });
  }

  /**
   * Add memory to current deck
   */
  async addMemoryToCurrentDeck(
    userId: string,
    memoryId: string,
  ): Promise<void> {
    const deck = await this.getOrCreateCurrentDeck(userId);

    // Check if already in deck
    const existing = await this.prisma.memoryDeckItem.findFirst({
      where: { memoryDeckId: deck.id, memoryId },
    });

    if (existing) return; // Already added

    // Get next sort order
    const maxOrder = await this.prisma.memoryDeckItem.findFirst({
      where: { memoryDeckId: deck.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const nextOrder = (maxOrder?.sortOrder ?? -1) + 1;

    // Add to deck
    await this.prisma.memoryDeckItem.create({
      data: {
        memoryDeckId: deck.id,
        memoryId,
        sortOrder: nextOrder,
      },
    });
  }

  /**
   * Archive deck
   */
  async archiveDeck(userId: string, deckId: string): Promise<void> {
    await this.prisma.memoryDeck.updateMany({
      where: { id: deckId, userId },
      data: { isArchived: true },
    });
  }

  /**
   * Auto-create weekly deck (called by scheduler)
   */
  async autoCreateWeeklyDeck(userId: string): Promise<any> {
    // Archive current deck
    const current = await this.getCurrentDeck(userId);
    if (current) {
      await this.archiveDeck(userId, current.id);
    }

    // Create new empty deck
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }); // Sunday

    return this.prisma.memoryDeck.create({
      data: {
        userId,
        title: `Week of ${format(weekStart, 'MMM d, yyyy')}`,
        autoCreated: true,
        weekStartDate: weekStart,
        isArchived: false,
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });
  }

  /**
   * Get all decks (archived and current)
   */
  async getAllDecks(userId: string): Promise<any[]> {
    const decks = await this.prisma.memoryDeck.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    return decks.map((deck) => ({
      ...deck,
      itemCount: deck._count.items,
      _count: undefined,
    }));
  }

  /**
   * Get a specific deck
   */
  async getDeck(userId: string, deckId: string): Promise<any> {
    const deck = await this.prisma.memoryDeck.findFirst({
      where: { id: deckId, userId },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    if (!deck) {
      throw new NotFoundException('Memory deck not found');
    }

    return {
      ...deck,
      itemCount: deck._count.items,
      _count: undefined,
    };
  }

  /**
   * Get deck items with full memory data
   */
  async getDeckItems(userId: string, deckId: string): Promise<any[]> {
    // Verify deck ownership
    const deck = await this.prisma.memoryDeck.findFirst({
      where: { id: deckId, userId },
    });

    if (!deck) {
      throw new NotFoundException('Memory deck not found');
    }

    // Get items with full memory data
    const items = await this.prisma.memoryDeckItem.findMany({
      where: { memoryDeckId: deckId },
      orderBy: { sortOrder: 'asc' },
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

    return items;
  }

  /**
   * Update a memory deck
   */
  async updateDeck(
    userId: string,
    deckId: string,
    dto: UpdateMemoryDeckDto,
  ): Promise<any> {
    // Verify deck ownership
    const existingDeck = await this.prisma.memoryDeck.findFirst({
      where: { id: deckId, userId },
    });

    if (!existingDeck) {
      throw new NotFoundException('Memory deck not found');
    }

    // Update the deck
    const updatedDeck = await this.prisma.memoryDeck.update({
      where: { id: deckId },
      data: { title: dto.title },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    return {
      ...updatedDeck,
      itemCount: updatedDeck._count.items,
      _count: undefined,
    };
  }

  /**
   * Delete a memory deck
   */
  async deleteDeck(userId: string, deckId: string): Promise<void> {
    // Verify deck ownership
    const deck = await this.prisma.memoryDeck.findFirst({
      where: { id: deckId, userId },
    });

    if (!deck) {
      throw new NotFoundException('Memory deck not found');
    }

    // Delete will cascade to items
    await this.prisma.memoryDeck.delete({
      where: { id: deckId },
    });
  }
}
