import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class EventsService {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Create event entry for a memory
   * Called when creating an event-type memory with structured storage
   */
  async createForMemory(memoryId: string, eventName: string): Promise<any> {
    const normalizedName = eventName.trim();

    console.log('Creating event entry for memory:', memoryId);
    const enrichedData = await this.enrichEventWithOpenAI(normalizedName);

    const event = await this.prisma.event.create({
      data: {
        memoryId,
        description: enrichedData.description,
        startAt: enrichedData.eventDate,
        tags: enrichedData.tags || [],
        lastEnrichedAt: new Date(),
      },
    });

    console.log('Event created for memory:', event.memoryId);
    return event;
  }

  /**
   * Get all events with memory information
   */
  async findAll(): Promise<any[]> {
    const events = await this.prisma.event.findMany({
      include: {
        memory: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return events.map((event) => ({
      id: event.memoryId,
      memoryId: event.memoryId,
      startAt: event.startAt,
      endAt: event.endAt,
      timezone: event.timezone,
      description: event.description,
      tags: event.tags,
      lastEnrichedAt: event.lastEnrichedAt,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      memory: event.memory,
    }));
  }

  /**
   * Get event by memory ID
   */
  async findById(memoryId: string): Promise<any> {
    const event = await this.prisma.event.findUnique({
      where: { memoryId },
      include: {
        memory: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }

    return event;
  }

  /**
   * Re-enrich event with OpenAI (admin only)
   */
  async enrichEvent(memoryId: string): Promise<any> {
    const event = await this.prisma.event.findUnique({
      where: { memoryId },
      include: {
        memory: true,
      },
    });

    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }

    console.log('Re-enriching event with OpenAI:', event.memory.title);
    const enrichedData = await this.enrichEventWithOpenAI(event.memory.title || event.memory.body || 'Unknown Event');

    const updatedEvent = await this.prisma.event.update({
      where: { memoryId },
      data: {
        description: enrichedData.description,
        startAt: enrichedData.eventDate,
        tags: enrichedData.tags || [],
        lastEnrichedAt: new Date(),
      },
    });

    console.log('Event enriched:', updatedEvent.memoryId);
    return updatedEvent;
  }

  /**
   * Enrich event with OpenAI
   */
  private async enrichEventWithOpenAI(eventName: string): Promise<any> {
    try {
      const prompt = `Provide detailed information about the event "${eventName}" in JSON format with the following fields:
- description: A clear, informative description of the event (2-3 sentences)
- eventDate: Estimated or known date of the event in ISO 8601 format (YYYY-MM-DD), or null if not applicable
- tags: Array of 3-5 relevant tags/categories for this event (e.g., ["historical", "political"], ["sports", "annual"], etc.)

Return ONLY valid JSON, no additional text.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides information about events. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error('No response from OpenAI for event enrichment');
        return this.getDefaultEventData();
      }

      const eventData = JSON.parse(content);

      return {
        description: eventData.description || null,
        eventDate: eventData.eventDate ? new Date(eventData.eventDate) : null,
        tags: eventData.tags || [],
      };
    } catch (error) {
      console.error('Error enriching event with OpenAI:', error);
      return this.getDefaultEventData();
    }
  }

  private getDefaultEventData() {
    return {
      description: null,
      eventDate: null,
      tags: [],
    };
  }
}
