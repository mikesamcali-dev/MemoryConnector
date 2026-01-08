import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class WordsService {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Normalize word value according to data integrity rules:
   * - Convert to lowercase
   * - Trim leading/trailing whitespace
   * - Normalize internal spacing to single space
   */
  private normalizeWord(wordText: string): string {
    return wordText
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' '); // Normalize internal spacing
  }

  /**
   * Create or find a standalone word
   * Returns existing word if duplicate found, creates new if unique
   */
  async createOrFind(wordText: string): Promise<{
    word: any;
    status: 'existing' | 'created';
  }> {
    // Step 1: Normalize the incoming word value
    const normalizedWord = this.normalizeWord(wordText);

    // Step 2: Query the Word table for an existing record
    let existingWord;
    try {
      existingWord = await this.prisma.word.findUnique({
        where: { word: normalizedWord },
      });
    } catch (error) {
      // Fail the operation if the lookup step fails
      console.error('Word lookup failed:', error);
      throw new HttpException(
        'Database lookup failed - cannot verify word uniqueness',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Step 3: If match exists - return existing Word
    if (existingWord) {
      console.log(`[DATA INTEGRITY] Word "${normalizedWord}" already exists (ID: ${existingWord.id})`);
      return {
        word: existingWord,
        status: 'existing',
      };
    }

    // Step 4: If no match - insert new word
    console.log(`[DATA INTEGRITY] Creating new word: "${normalizedWord}"`);

    // Enrich word data with OpenAI
    const enrichedData = await this.enrichWordWithOpenAI(normalizedWord);

    // Create standalone word entry
    const newWord = await this.prisma.word.create({
      data: {
        word: normalizedWord,
        ...enrichedData,
        lastEnrichedAt: new Date(),
      },
    });

    console.log(`[DATA INTEGRITY] Word created successfully (ID: ${newWord.id})`);

    return {
      word: newWord,
      status: 'created',
    };
  }

  /**
   * Get a word by ID
   */
  async findById(id: string): Promise<any> {
    const word = await this.prisma.word.findUnique({
      where: { id },
      include: {
        memoryLinks: {
          include: {
            memory: {
              select: {
                id: true,
                body: true,
                createdAt: true,
                userId: true,
              },
            },
          },
          take: 10, // Limit to 10 most recent memories
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!word) {
      throw new HttpException('Word not found', HttpStatus.NOT_FOUND);
    }

    return word;
  }

  /**
   * Find word by word text
   */
  async findByWord(wordText: string): Promise<any> {
    const normalizedWord = this.normalizeWord(wordText);

    const word = await this.prisma.word.findUnique({
      where: { word: normalizedWord },
      include: {
        memoryLinks: {
          include: {
            memory: {
              select: {
                id: true,
                body: true,
                createdAt: true,
                userId: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return word;
  }

  /**
   * Re-enrich a word with OpenAI (admin only)
   */
  async enrichWord(id: string): Promise<any> {
    const word = await this.prisma.word.findUnique({
      where: { id },
    });

    if (!word) {
      throw new HttpException('Word not found', HttpStatus.NOT_FOUND);
    }

    const enrichedData = await this.enrichWordWithOpenAI(word.word);

    const updatedWord = await this.prisma.word.update({
      where: { id },
      data: {
        ...enrichedData,
        lastEnrichedAt: new Date(),
      },
    });

    return updatedWord;
  }

  /**
   * Update word details manually (admin only)
   */
  async updateWord(id: string, data: any): Promise<any> {
    const word = await this.prisma.word.findUnique({
      where: { id },
    });

    if (!word) {
      throw new HttpException('Word not found', HttpStatus.NOT_FOUND);
    }

    const updatedWord = await this.prisma.word.update({
      where: { id },
      data: {
        description: data.description,
        phonetic: data.phonetic,
        partOfSpeech: data.partOfSpeech,
        etymology: data.etymology,
        examples: data.examples,
        synonyms: data.synonyms,
        antonyms: data.antonyms,
        difficulty: data.difficulty,
      },
    });

    return updatedWord;
  }

  /**
   * Delete a word (admin only)
   * This will cascade delete all memory_word_links
   */
  async deleteWord(id: string): Promise<void> {
    const word = await this.prisma.word.findUnique({
      where: { id },
    });

    if (!word) {
      throw new HttpException('Word not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.word.delete({
      where: { id },
    });
  }

  /**
   * Get all words (admin only)
   * Returns all standalone word entries with user information
   */
  async findAll(): Promise<any[]> {
    const words = await this.prisma.word.findMany({
      include: {
        _count: {
          select: {
            memoryLinks: true,
          },
        },
        memoryLinks: {
          include: {
            memory: {
              select: {
                userId: true,
                user: {
                  select: {
                    email: true,
                  },
                },
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Most recently created first
      },
    });

    return words.map((word) => {
      // Get unique users who have used this word
      const userMap = new Map();
      word.memoryLinks.forEach(link => {
        const userId = link.memory.userId;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            userId,
            email: link.memory.user.email,
            count: 0,
          });
        }
        userMap.get(userId).count++;
      });

      const users = Array.from(userMap.values());

      return {
        id: word.id,
        word: word.word,
        description: word.description,
        phonetic: word.phonetic,
        partOfSpeech: word.partOfSpeech,
        difficulty: word.difficulty,
        lastEnrichedAt: word.lastEnrichedAt,
        createdAt: word.createdAt,
        updatedAt: word.updatedAt,
        memoryCount: word._count.memoryLinks,
        userCount: users.length,
        users: users,
      };
    });
  }

  /**
   * Get words with memory counts
   */
  async getWordsWithCounts(): Promise<any[]> {
    const words = await this.prisma.word.findMany({
      include: {
        _count: {
          select: {
            memoryLinks: true,
          },
        },
      },
      orderBy: {
        word: 'asc',
      },
    });

    return words.map((w) => ({
      word: w.word,
      count: w._count.memoryLinks,
      id: w.id,
    }));
  }

  /**
   * Use OpenAI to enrich word data
   */
  private async enrichWordWithOpenAI(word: string): Promise<any> {
    try {
      const prompt = `Provide detailed information about the word "${word}" in JSON format with the following fields:
- description: A clear, concise definition (1-2 sentences)
- phonetic: The phonetic pronunciation (IPA format if possible)
- partOfSpeech: The part of speech (noun, verb, adjective, etc.)
- etymology: Brief origin and history of the word (2-3 sentences)
- examples: Array of 3 example sentences using the word
- synonyms: Array of 3-5 synonyms
- antonyms: Array of 3-5 antonyms (if applicable, otherwise empty array)
- difficulty: Difficulty level for language learners (easy, medium, or hard)

Return ONLY valid JSON, no additional text.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful dictionary and language learning assistant. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const wordData = JSON.parse(content);

      return {
        description: wordData.description || null,
        phonetic: wordData.phonetic || null,
        partOfSpeech: wordData.partOfSpeech || null,
        etymology: wordData.etymology || null,
        examples: wordData.examples || null,
        synonyms: wordData.synonyms || null,
        antonyms: wordData.antonyms || null,
        difficulty: wordData.difficulty || null,
      };
    } catch (error) {
      console.error('Error enriching word with OpenAI:', error);
      // Return minimal data if OpenAI fails
      return {
        description: null,
        phonetic: null,
        partOfSpeech: null,
        etymology: null,
        examples: null,
        synonyms: null,
        antonyms: null,
        difficulty: null,
      };
    }
  }

  /**
   * Process phrase/word linking after memory creation
   * Follows the logic from word phrase logic.md:
   * - 1 word: Look up word, create if needed, link to memory
   * - 2 words: Look up phrase and individual words, create if needed, link to memory
   * - 3 words: Look up phrase and individual words, create if needed, link to memory
   * - More than 3 words: Do nothing
   */
  async processMemoryPhraseLinking(memoryId: string, text: string): Promise<void> {
    // Normalize and split text into words
    const normalizedText = text.trim();
    const words = normalizedText.split(/\s+/);
    const wordCount = words.length;

    console.log(`[PHRASE LINKING] Processing memory ${memoryId} with ${wordCount} word(s): "${normalizedText}"`);

    // More than 3 words: do nothing
    if (wordCount > 3) {
      console.log('[PHRASE LINKING] Text has more than 3 words, skipping');
      return;
    }

    // Process based on word count
    if (wordCount === 1) {
      // Single word: look up and link
      await this.processAndLinkWord(memoryId, words[0]);
    } else if (wordCount === 2) {
      // Two words: process phrase + individual words
      await this.processAndLinkPhrase(memoryId, normalizedText);
      await this.processAndLinkWord(memoryId, words[0]);
      await this.processAndLinkWord(memoryId, words[1]);
    } else if (wordCount === 3) {
      // Three words: process phrase + individual words
      await this.processAndLinkPhrase(memoryId, normalizedText);
      await this.processAndLinkWord(memoryId, words[0]);
      await this.processAndLinkWord(memoryId, words[1]);
      await this.processAndLinkWord(memoryId, words[2]);
    }

    console.log('[PHRASE LINKING] Processing complete');
  }

  /**
   * Process and link a single word to a memory
   */
  private async processAndLinkWord(memoryId: string, wordText: string): Promise<void> {
    try {
      // Use createOrFind which handles lookup and OpenAI enrichment if needed
      const { word, status } = await this.createOrFind(wordText);

      console.log(`[PHRASE LINKING] Word "${wordText}" ${status === 'existing' ? 'found' : 'created'} (ID: ${word.id})`);

      // Link word to memory (using upsert to avoid duplicates)
      await this.prisma.memoryWordLink.upsert({
        where: {
          memoryId_wordId: {
            memoryId,
            wordId: word.id,
          },
        },
        create: {
          memoryId,
          wordId: word.id,
        },
        update: {}, // No update needed if already exists
      });

      console.log(`[PHRASE LINKING] Linked word "${wordText}" to memory ${memoryId}`);
    } catch (error) {
      console.error(`[PHRASE LINKING] Error processing word "${wordText}":`, error);
      // Don't throw - continue processing other words
    }
  }

  /**
   * Process and link a phrase (multiple words) to a memory
   */
  private async processAndLinkPhrase(memoryId: string, phraseText: string): Promise<void> {
    try {
      // Use createOrFind which handles lookup and OpenAI enrichment if needed
      const { word: phrase, status } = await this.createOrFind(phraseText);

      console.log(`[PHRASE LINKING] Phrase "${phraseText}" ${status === 'existing' ? 'found' : 'created'} (ID: ${phrase.id})`);

      // Link phrase to memory (using upsert to avoid duplicates)
      await this.prisma.memoryWordLink.upsert({
        where: {
          memoryId_wordId: {
            memoryId,
            wordId: phrase.id,
          },
        },
        create: {
          memoryId,
          wordId: phrase.id,
        },
        update: {}, // No update needed if already exists
      });

      console.log(`[PHRASE LINKING] Linked phrase "${phraseText}" to memory ${memoryId}`);
    } catch (error) {
      console.error(`[PHRASE LINKING] Error processing phrase "${phraseText}":`, error);
      // Don't throw - continue processing
    }
  }
}
