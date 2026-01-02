import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WordsService } from '../words/words.service';
import { logger } from '../common/logger';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import {
  ExtractionResult,
  PersonEntity,
  EventEntity,
  LocationEntity,
  RelationshipEntity,
} from './dto/extraction-result.dto';

@Injectable()
export class EntityProcessorService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private wordsService: WordsService,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Calculate similarity between two strings (fuzzy matching)
   * Returns a score between 0 and 1
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    // Exact match
    if (s1 === s2) return 1.0;

    // Remove spaces and special characters for comparison
    const normalized1 = s1.replace(/[\s\-_]/g, '');
    const normalized2 = s2.replace(/[\s\-_]/g, '');

    if (normalized1 === normalized2) return 0.95;

    // Check if one contains the other
    if (s1.includes(s2) || s2.includes(s1)) return 0.85;

    // Levenshtein distance based similarity
    const maxLen = Math.max(s1.length, s2.length);
    const distance = this.levenshteinDistance(s1, s2);
    const similarity = 1 - distance / maxLen;

    return similarity;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  async processExtractionResult(
    memoryId: string,
    userId: string,
    extraction: ExtractionResult
  ): Promise<void> {
    try {
      // Process persons with fuzzy matching
      for (const person of extraction.persons) {
        await this.createOrUpdatePerson(memoryId, userId, person);
      }

      // Process locations with fuzzy matching
      for (const location of extraction.locations) {
        await this.createOrUpdateLocation(memoryId, userId, location);
      }

      // Process words (auto-create and enrich if needed)
      if (extraction.words && extraction.words.length > 0) {
        await this.processWords(memoryId, extraction.words);
      }

      // Process events
      for (const event of extraction.events) {
        await this.createOrUpdateEvent(memoryId, userId, event);
      }

      // Process relationships
      for (const relationship of extraction.relationships) {
        await this.createRelationship(memoryId, relationship);
      }

      // Store extraction metadata in memory.data
      await this.prisma.memory.update({
        where: { id: memoryId },
        data: {
          data: {
            extraction: {
              summaries: extraction.summaries,
              follow_up_actions: extraction.follow_up_actions,
              extracted_at: new Date().toISOString(),
              words: extraction.words,
            },
          } as any, // Cast to any for JSON field
        },
      });

      logger.info({ memoryId }, 'Entity extraction processing completed');
    } catch (error) {
      logger.error({ error, memoryId }, 'Entity processing failed');
      throw error;
    }
  }

  private async createOrUpdatePerson(
    memoryId: string,
    userId: string,
    person: PersonEntity
  ): Promise<void> {
    try {
      const personName = person.canonical_name;

      // Fuzzy match against existing persons
      const allPersons = await this.prisma.person.findMany({
        select: { id: true, displayName: true },
      });

      let matchedPerson = null;
      let highestSimilarity = 0;

      for (const existingPerson of allPersons) {
        const similarity = this.calculateSimilarity(personName, existingPerson.displayName);
        if (similarity > highestSimilarity && similarity >= 0.75) {
          highestSimilarity = similarity;
          matchedPerson = existingPerson;
        }
      }

      if (matchedPerson) {
        // Link existing person to this memory
        await this.prisma.memory.update({
          where: { id: memoryId },
          data: { personId: matchedPerson.id },
        });

        logger.info(
          {
            personId: matchedPerson.id,
            memoryId,
            matchedName: matchedPerson.displayName,
            extractedName: personName,
            similarity: highestSimilarity
          },
          'Linked similar person to memory (fuzzy match)'
        );
        return;
      }

      // Create new person entity (Person is a shared entity, not tied to a memory)
      // Build a human-readable bio from extracted metadata
      const bioParts: string[] = [];

      if (person.inferred_profession) {
        bioParts.push(person.inferred_profession);
      }

      if (person.inferred_age_range) {
        bioParts.push(`Age: ${person.inferred_age_range}`);
      }

      if (person.inferred_gender) {
        bioParts.push(`Gender: ${person.inferred_gender}`);
      }

      const bio = bioParts.length > 0 ? bioParts.join(' • ') : null;

      const newPerson = await this.prisma.person.create({
        data: {
          displayName: personName,
          email: person.contact_info?.[0]?.email || null,
          phone: person.contact_info?.[0]?.phone || null,
          bio: bio,
        },
      });

      // Link to original memory
      await this.prisma.memory.update({
        where: { id: memoryId },
        data: { personId: newPerson.id },
      });

      logger.info({ personName }, 'Created new person entity');
    } catch (error) {
      logger.error({ error, person }, 'Failed to create person entity');
    }
  }

  private async createOrUpdateEvent(
    memoryId: string,
    userId: string,
    event: EventEntity
  ): Promise<void> {
    try {
      // Events are 1:1 with memories, so create Event record for this memory
      await this.prisma.event.create({
        data: {
          memoryId,
          startAt: event.start_datetime ? new Date(event.start_datetime) : null,
          endAt: event.end_datetime ? new Date(event.end_datetime) : null,
          description: event.description || null,
          tags: [], // Could extract from event data
        },
      });

      // Update memory title/body if needed
      await this.prisma.memory.update({
        where: { id: memoryId },
        data: {
          title: event.title,
          body: event.description,
          startAt: event.start_datetime ? new Date(event.start_datetime) : null,
          endAt: event.end_datetime ? new Date(event.end_datetime) : null,
        },
      });

      logger.info({ eventTitle: event.title }, 'Created event entity');
    } catch (error) {
      logger.error({ error, event }, 'Failed to create event entity');
    }
  }

  private async createOrUpdateLocation(
    memoryId: string,
    userId: string,
    location: LocationEntity
  ): Promise<void> {
    try {
      const locationName = location.name;

      // Fuzzy match against existing locations
      const allLocations = await this.prisma.location.findMany({
        select: { id: true, name: true, lastEnrichedAt: true },
      });

      let matchedLocation = null;
      let highestSimilarity = 0;

      for (const existingLocation of allLocations) {
        const similarity = this.calculateSimilarity(locationName, existingLocation.name);
        if (similarity > highestSimilarity && similarity >= 0.75) {
          highestSimilarity = similarity;
          matchedLocation = existingLocation;
        }
      }

      if (matchedLocation) {
        // Link to existing location
        await this.prisma.memory.update({
          where: { id: memoryId },
          data: { locationId: matchedLocation.id },
        });

        // Enrich if not already enriched
        if (!matchedLocation.lastEnrichedAt && this.openai) {
          await this.enrichLocation(matchedLocation.id, locationName);
        }

        logger.info(
          {
            locationId: matchedLocation.id,
            memoryId,
            matchedName: matchedLocation.name,
            extractedName: locationName,
            similarity: highestSimilarity
          },
          'Linked similar location to memory (fuzzy match)'
        );
        return;
      }

      // Create new location (Location is a shared entity)
      const newLocation = await this.prisma.location.create({
        data: {
          name: locationName,
          address: location.address || null,
          city: location.city || null,
          state: location.state || null,
          country: location.country || null,
          latitude: location.geocoordinates?.lat || null,
          longitude: location.geocoordinates?.lon || null,
          placeType: 'venue',
        },
      });

      // Link to original memory
      await this.prisma.memory.update({
        where: { id: memoryId },
        data: { locationId: newLocation.id },
      });

      // Enrich with OpenAI
      if (this.openai) {
        await this.enrichLocation(newLocation.id, locationName);
      }

      logger.info({ locationName }, 'Created and enriched new location entity');
    } catch (error) {
      logger.error({ error, location }, 'Failed to create location entity');
    }
  }

  /**
   * Enrich location with OpenAI
   */
  private async enrichLocation(locationId: string, locationName: string): Promise<void> {
    try {
      const prompt = `Provide information about the location "${locationName}" in JSON format:
{
  "placeType": "Type of place (city, venue, business, restaurant, park, etc.)",
  "address": "Full address if known",
  "city": "City name",
  "state": "State/Province",
  "country": "Country"
}

Return ONLY valid JSON. If you don't know specific details, use null for that field.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a location information assistant. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        logger.warn({ locationName }, 'No OpenAI response for location enrichment');
        return;
      }

      const locationData = JSON.parse(content);

      await this.prisma.location.update({
        where: { id: locationId },
        data: {
          placeType: locationData.placeType || 'venue',
          address: locationData.address || null,
          city: locationData.city || null,
          state: locationData.state || null,
          country: locationData.country || null,
          lastEnrichedAt: new Date(),
        },
      });

      logger.info({ locationName, locationId }, 'Location enriched with OpenAI');
    } catch (error) {
      logger.error({ error, locationName }, 'Failed to enrich location');
    }
  }

  /**
   * Process extracted words - create Word records and enrich if needed
   */
  private async processWords(memoryId: string, words: string[]): Promise<void> {
    try {
      for (const wordText of words) {
        await this.createOrEnrichWord(memoryId, wordText);
      }

      logger.info({ memoryId, wordCount: words.length }, 'Processed extracted words');
    } catch (error) {
      logger.error({ error, memoryId }, 'Failed to process words');
    }
  }

  /**
   * Create or find existing word and enrich if needed
   * Uses WordsService data integrity agent to prevent duplicates
   */
  private async createOrEnrichWord(memoryId: string, wordText: string): Promise<void> {
    try {
      // Use WordsService to create/find standalone word
      const result = await this.wordsService.createOrFind(wordText);

      // Check if link already exists
      const existingLink = await this.prisma.memoryWordLink.findUnique({
        where: {
          memoryId_wordId: {
            memoryId: memoryId,
            wordId: result.word.id,
          },
        },
      });

      if (existingLink) {
        logger.debug({ wordText, memoryId }, 'Word already linked to this memory');
        return;
      }

      // Create link from memory to word
      await this.prisma.memoryWordLink.create({
        data: {
          memoryId: memoryId,
          wordId: result.word.id,
        },
      });

      if (result.status === 'existing') {
        logger.info(
          { wordText, wordId: result.word.id, memoryId },
          '[DATA INTEGRITY] Linked to existing word'
        );
      } else {
        logger.info({ wordText, wordId: result.word.id, memoryId }, '[DATA INTEGRITY] Created new word and linked');
      }
    } catch (error) {
      logger.error({ error, wordText }, 'Failed to create/link word');
    }
  }

  private async createRelationship(
    memoryId: string,
    relationship: RelationshipEntity
  ): Promise<void> {
    try {
      // Relationships are stored as MemoryLinks
      // The source and target IDs from extraction need to be mapped to actual memory IDs
      // For now, we'll skip this as it requires maintaining a mapping
      // between extraction IDs and database IDs

      logger.debug({ relationship }, 'Relationship tracking noted');
    } catch (error) {
      logger.error({ error }, 'Failed to create relationship');
    }
  }
}
