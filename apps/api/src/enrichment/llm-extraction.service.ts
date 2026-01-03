import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { logger } from '../common/logger';
import {
  ExtractionResult,
  PersonEntity,
  EventEntity,
  LocationEntity,
  OrganizationEntity,
  RelationshipEntity,
  FollowUpAction,
} from './dto/extraction-result.dto';

const SIMPLIFIED_EXTRACTION_PROMPT = `
You are an entity extraction assistant. Extract person names, location names, and meaningful words from the given text.

EXTRACTION RULES:

1. PERSONS: Extract all person names (first names, full names, nicknames)
   - Include name variants (Mike, Michael, etc.)
   - Return as array of strings: ["Mike", "Sarah Johnson"]

2. LOCATIONS: Extract all location names (cities, venues, businesses, addresses)
   - Include common variations (PizzaHut, Pizza Hut, etc.)
   - Return as array of strings: ["New York", "Pizza Hut", "Central Park"]

3. WORDS & PHRASES: Extract both individual meaningful words AND multi-word phrases
   - Include individual words: ["serendipitous", "ephemeral", "paradigm"]
   - Include meaningful phrases (2-4 words):
     * Common idioms: ["red herring", "wild goose chase", "piece of cake"]
     * Technical terms: ["quantum entanglement", "machine learning", "artificial intelligence"]
     * Proper nouns: ["Detroit Tigers", "New York Times", "United Nations"]
     * Compound concepts: ["supply chain", "climate change", "social media"]
   - EXCLUDE common stop words (the, a, an, I, you, he, she, it, we, they, as, at, by, for, from, in, into, of, on, to, with, is, was, are, were, be, been, being, have, has, had, do, does, did, will, would, should, could, may, might, can)
   - EXCLUDE person names or location names already extracted
   - EXCLUDE single letters or numbers
   - IMPORTANT: Prioritize extracting well-known phrases as complete units
     * If you see "red herring", extract it as ["red herring"] (NOT as ["red", "herring"])
     * If you see "wild goose chase", extract it as ["wild goose chase"] (NOT as ["wild", "goose", "chase"])
     * Common phrases should be kept together as single entries
   - Return as array of strings: ["delicious", "conversation", "red herring", "exciting"]

OUTPUT FORMAT (JSON only, no markdown):
{
  "persons": ["name1", "name2"],
  "locations": ["location1", "location2"],
  "words": ["word1", "word2"],
  "events": [],
  "organizations": [],
  "summaries": [],
  "follow_up_actions": [],
  "relationships": []
}

CONSTRAINTS:
- Return ONLY valid JSON
- No markdown, no code blocks, no explanations
- Extract actual words from the text, don't invent
- Be generous with extraction - when in doubt, include it
`;

@Injectable()
export class LLMExtractionService {
  private openai: OpenAI;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async extractEntities(memoryText: string): Promise<ExtractionResult> {
    if (!this.openai) {
      logger.warn('OpenAI not configured, returning empty extraction');
      return this.getEmptyResult();
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: SIMPLIFIED_EXTRACTION_PROMPT,
          },
          {
            role: 'user',
            content: `Extract entities from this text:\n\n"${memoryText}"`,
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        logger.warn('No content in OpenAI response');
        return this.getEmptyResult();
      }

      // Parse and validate JSON
      const parsed = JSON.parse(content);
      const result = this.validateAndNormalizeResult(parsed);

      logger.info(
        {
          personsCount: result.persons.length,
          locationsCount: result.locations.length,
          wordsCount: result.words?.length || 0,
        },
        'Entity extraction completed'
      );

      return result;
    } catch (error) {
      logger.error({ error }, 'LLM extraction failed');
      return this.getEmptyResult();
    }
  }

  private validateAndNormalizeResult(data: any): ExtractionResult {
    // Convert simple string arrays to entity objects
    const persons = Array.isArray(data.persons)
      ? data.persons.map((name: string) => ({ canonical_name: name, name_variants: [], confidence_score: 0.8 }))
      : [];

    const locations = Array.isArray(data.locations)
      ? data.locations.map((name: string) => ({ name, confidence_score: 0.8 }))
      : [];

    // Singularize words and phrases
    const words = Array.isArray(data.words)
      ? data.words.map((word: string) => this.singularize(word))
      : [];

    return {
      persons,
      events: Array.isArray(data.events) ? data.events : [],
      locations,
      organizations: Array.isArray(data.organizations) ? data.organizations : [],
      summaries: Array.isArray(data.summaries) ? data.summaries : [],
      follow_up_actions: Array.isArray(data.follow_up_actions) ? data.follow_up_actions : [],
      relationships: Array.isArray(data.relationships) ? data.relationships : [],
      words,
    };
  }

  /**
   * Convert plural words to singular form
   */
  private singularize(word: string): string {
    const trimmed = word.trim();
    const lowerTrimmed = trimmed.toLowerCase();

    // List of common phrases and idioms that should NOT be singularized
    const preservedPhrases = [
      'red herring', 'wild goose chase', 'piece of cake', 'break the ice',
      'hit the nail on the head', 'once in a blue moon', 'blessing in disguise',
      'devil\'s advocate', 'elephant in the room', 'silver lining',
      'the last straw', 'best of both worlds', 'see eye to eye',
      'united states', 'united nations', 'social media', 'climate change',
      'machine learning', 'artificial intelligence', 'quantum computing',
      'supply chain', 'status quo', 'modus operandi', 'per se',
    ];

    // Check if this is a preserved phrase (case-insensitive)
    if (preservedPhrases.includes(lowerTrimmed)) {
      return trimmed; // Return original without singularization
    }

    // Handle phrases by singularizing each word
    if (trimmed.includes(' ')) {
      return trimmed
        .split(' ')
        .map(w => this.singularizeSingleWord(w))
        .join(' ');
    }

    return this.singularizeSingleWord(trimmed);
  }

  /**
   * Singularize a single word
   */
  private singularizeSingleWord(word: string): string {
    const lower = word.toLowerCase();

    // Irregular plurals
    const irregulars: { [key: string]: string } = {
      'children': 'child',
      'people': 'person',
      'men': 'man',
      'women': 'woman',
      'feet': 'foot',
      'teeth': 'tooth',
      'geese': 'goose',
      'mice': 'mouse',
      'oxen': 'ox',
      'sheep': 'sheep',
      'deer': 'deer',
      'fish': 'fish',
      'series': 'series',
      'species': 'species',
    };

    if (irregulars[lower]) {
      return this.preserveCase(word, irregulars[lower]);
    }

    // Don't modify short words or words without 's' at end
    if (word.length <= 3 || !word.endsWith('s')) {
      return word;
    }

    // Handle specific endings
    if (lower.endsWith('ies') && word.length > 4) {
      // berries -> berry, cities -> city
      return word.slice(0, -3) + 'y';
    }

    if (lower.endsWith('ves')) {
      // wolves -> wolf, knives -> knife
      return word.slice(0, -3) + 'f';
    }

    if (lower.endsWith('ses') || lower.endsWith('xes') || lower.endsWith('zes') ||
        lower.endsWith('ches') || lower.endsWith('shes')) {
      // boxes -> box, churches -> church, bushes -> bush
      return word.slice(0, -2);
    }

    if (lower.endsWith('oes')) {
      // tomatoes -> tomato, heroes -> hero
      return word.slice(0, -2);
    }

    // Default: just remove 's'
    // tigers -> tiger, cats -> cat
    return word.slice(0, -1);
  }

  /**
   * Preserve original capitalization when converting word
   */
  private preserveCase(original: string, converted: string): string {
    if (original[0] === original[0].toUpperCase()) {
      return converted.charAt(0).toUpperCase() + converted.slice(1);
    }
    return converted;
  }

  private getEmptyResult(): ExtractionResult {
    return {
      persons: [],
      events: [],
      locations: [],
      organizations: [],
      summaries: [],
      follow_up_actions: [],
      relationships: [],
      words: [],
    };
  }
}
