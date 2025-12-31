import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SpellCheckService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if a word is misspelled and get suggestions
   * Combines suggestions from Datamuse API and existing words in database
   */
  async getSuggestions(word: string, userId?: string): Promise<string[]> {
    const suggestions: string[] = [];

    try {
      // 1. Get spelling suggestions from Datamuse API
      const response = await fetch(
        `https://api.datamuse.com/sug?s=${encodeURIComponent(word)}&max=5`
      );

      if (response.ok) {
        const data = await response.json();
        const apiSuggestions = data.map((item: any) => item.word);
        suggestions.push(...apiSuggestions);
      }
    } catch (error) {
      console.error('Datamuse API error:', error);
    }

    // 2. Check database for similar words
    if (userId) {
      try {
        // Get ALL words from database and do similarity matching in code
        // This is simple and works well for small word sets
        const allWords = await this.prisma.word.findMany({
          select: { word: true },
        });

        // Calculate similarity for each word
        const wordLower = word.toLowerCase();
        const similar = allWords
          .map(w => ({
            word: w.word,
            similarity: this.calculateSimilarity(wordLower, w.word.toLowerCase()),
          }))
          .filter(w => w.similarity > 0.5) // Only keep words with >50% similarity
          .sort((a, b) => b.similarity - a.similarity) // Sort by similarity
          .slice(0, 5) // Top 5
          .map(w => w.word);

        // Add database words to suggestions (avoiding duplicates)
        for (const dbWord of similar) {
          if (!suggestions.some(s => s.toLowerCase() === dbWord.toLowerCase())) {
            suggestions.push(dbWord);
          }
        }
      } catch (error) {
        console.error('Database word lookup error:', error);
      }
    }

    // Return unique suggestions (case-insensitive), max 8
    const uniqueSuggestions = suggestions
      .filter((s, index, self) =>
        self.findIndex(t => t.toLowerCase() === s.toLowerCase()) === index
      )
      .slice(0, 8);

    return uniqueSuggestions;
  }

  /**
   * Check if the word likely needs correction
   * Returns true if suggestions are available and different from input
   */
  async needsCorrection(word: string, userId?: string): Promise<boolean> {
    const suggestions = await this.getSuggestions(word, userId);
    return suggestions.length > 0 && suggestions[0].toLowerCase() !== word.toLowerCase();
  }

  /**
   * Check entire text for spelling errors
   * Returns array of misspelled words with suggestions
   */
  async checkText(text: string, userId?: string): Promise<Array<{
    word: string;
    isCorrect: boolean;
    suggestions: string[];
    position: { start: number; end: number };
  }>> {
    // Load user's excluded words
    let excludedWords: Set<string> = new Set();
    if (userId) {
      try {
        const excluded = await this.prisma.excludedWord.findMany({
          where: { userId },
          select: { word: true },
        });
        excludedWords = new Set(excluded.map(e => e.word.toLowerCase()));
      } catch (error) {
        console.error('Error loading excluded words:', error);
      }
    }

    // Extract words from text (alphanumeric only)
    const wordRegex = /\b[a-zA-Z]+\b/g;
    const matches = [...text.matchAll(wordRegex)];

    const results = await Promise.all(
      matches.map(async (match) => {
        const word = match[0];
        const position = { start: match.index!, end: match.index! + word.length };

        // Skip very short words (likely correct or intentional)
        if (word.length <= 2) {
          return {
            word,
            isCorrect: true,
            suggestions: [],
            position,
          };
        }

        // Skip excluded words
        if (excludedWords.has(word.toLowerCase())) {
          return {
            word,
            isCorrect: true,
            suggestions: [],
            position,
          };
        }

        const suggestions = await this.getSuggestions(word, userId);
        const isCorrect = suggestions.length === 0 ||
                          suggestions[0].toLowerCase() === word.toLowerCase();

        return {
          word,
          isCorrect,
          suggestions: isCorrect ? [] : suggestions,
          position,
        };
      })
    );

    return results;
  }

  /**
   * Add a word to the user's excluded words list
   */
  async addExcludedWord(userId: string, word: string): Promise<void> {
    await this.prisma.excludedWord.create({
      data: {
        userId,
        word: word.toLowerCase(),
      },
    });
  }

  /**
   * Remove a word from the user's excluded words list
   */
  async removeExcludedWord(userId: string, word: string): Promise<void> {
    await this.prisma.excludedWord.deleteMany({
      where: {
        userId,
        word: word.toLowerCase(),
      },
    });
  }

  /**
   * Get all excluded words for a user
   */
  async getExcludedWords(userId: string): Promise<string[]> {
    const excluded = await this.prisma.excludedWord.findMany({
      where: { userId },
      select: { word: true },
      orderBy: { createdAt: 'desc' },
    });
    return excluded.map(e => e.word);
  }

  /**
   * Calculate similarity between two strings (0 to 1)
   * Uses Levenshtein distance and length normalization
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;

    const similarity = 1 - distance / maxLength;
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
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
