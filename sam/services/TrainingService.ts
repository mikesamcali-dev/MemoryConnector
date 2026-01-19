/**
 * SAM Training Service - Micro-training examples and validation
 */

import { SamTrainingExample } from '../domain/types';

export interface TrainingSuggestion {
  title: string;
  content: string;
  canonical_phrases: string[];
}

export interface TrainingTestReport {
  passed: number;
  failed: number;
  total: number;
  results: Array<{
    example_id: string;
    passed: boolean;
    errors: string[];
  }>;
}

export class TrainingService {
  /**
   * Suggest training examples for a memory
   */
  async suggestTrainingExamples(suggestion: TrainingSuggestion): Promise<SamTrainingExample[]> {
    const { title, content, canonical_phrases } = suggestion;
    const examples: SamTrainingExample[] = [];

    // Example 1: Direct request using canonical phrase
    if (canonical_phrases.length > 0) {
      const phrase = canonical_phrases[0];
      examples.push({
        id: `tr_${Date.now()}_1`,
        user: `How should I handle ${phrase}?`,
        assistant: `Based on "${title}": ${content.substring(0, 200)}`,
        assertions: [phrase, title.toLowerCase()],
        last_tested_at: null,
        pass_rate: 0.0
      });
    }

    // Example 2: Paraphrased request
    if (canonical_phrases.length > 1) {
      const phrase = canonical_phrases[1];
      examples.push({
        id: `tr_${Date.now()}_2`,
        user: `What's the best approach for ${phrase}?`,
        assistant: `Use the approach from "${title}": ${content.substring(0, 200)}`,
        assertions: [title.toLowerCase()],
        last_tested_at: null,
        pass_rate: 0.0
      });
    }

    // Example 3: Edge case (if many phrases)
    if (canonical_phrases.length > 5) {
      examples.push({
        id: `tr_${Date.now()}_3`,
        user: `Should I always apply ${canonical_phrases[0]}?`,
        assistant: `Consider context. "${title}" applies when: ${content.substring(0, 150)}`,
        assertions: ['context', 'consider'],
        last_tested_at: null,
        pass_rate: 0.0
      });
    }

    return examples.slice(0, 3);
  }

  /**
   * Run tests on training examples
   */
  async runTrainingTests(params: {
    draft: { training_examples?: SamTrainingExample[] };
    canonical_phrases: string[];
  }): Promise<TrainingTestReport> {
    const { draft, canonical_phrases } = params;
    const examples = draft.training_examples || [];

    const results = examples.map(example => {
      const errors: string[] = [];
      let passed = true;

      // Check that assistant response contains assertions
      for (const assertion of example.assertions) {
        const lowerAssertion = assertion.toLowerCase();
        const lowerAssistant = example.assistant.toLowerCase();

        // Handle "forbidden:..." assertions
        if (lowerAssertion.startsWith('forbidden:')) {
          const forbidden = lowerAssertion.replace('forbidden:', '').trim();
          if (lowerAssistant.includes(forbidden)) {
            errors.push(`Response should not contain "${forbidden}"`);
            passed = false;
          }
        } else {
          // Normal assertion - must be present
          if (!lowerAssistant.includes(lowerAssertion)) {
            errors.push(`Response missing required assertion "${assertion}"`);
            passed = false;
          }
        }
      }

      return {
        example_id: example.id,
        passed,
        errors
      };
    });

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    return {
      passed,
      failed,
      total: examples.length,
      results
    };
  }

  /**
   * Update pass rates after running tests
   */
  updatePassRates(
    examples: SamTrainingExample[],
    report: TrainingTestReport
  ): SamTrainingExample[] {
    return examples.map(example => {
      const result = report.results.find(r => r.example_id === example.id);
      if (!result) return example;

      return {
        ...example,
        last_tested_at: new Date().toISOString(),
        pass_rate: result.passed ? 1.0 : 0.0
      };
    });
  }
}
