import { Injectable } from '@nestjs/common';

export interface TrainingSuggestion {
  title: string;
  content: string;
  canonicalPhrases: string[];
}

export interface TrainingExample {
  user: string;
  assistant: string;
  assertions: string[];
}

@Injectable()
export class SamTrainingService {
  suggestTrainingExamples(suggestion: TrainingSuggestion): TrainingExample[] {
    const { title, content, canonicalPhrases } = suggestion;
    const examples: TrainingExample[] = [];

    // Example 1: Direct request
    if (canonicalPhrases.length > 0) {
      const phrase = canonicalPhrases[0];
      examples.push({
        user: `How should I handle ${phrase}?`,
        assistant: `Based on "${title}": ${content.substring(0, 200)}`,
        assertions: [phrase, title.toLowerCase()]
      });
    }

    // Example 2: Paraphrased
    if (canonicalPhrases.length > 1) {
      const phrase = canonicalPhrases[1];
      examples.push({
        user: `What's the best approach for ${phrase}?`,
        assistant: `Use the approach from "${title}": ${content.substring(0, 200)}`,
        assertions: [title.toLowerCase()]
      });
    }

    return examples.slice(0, 3);
  }

  runTrainingTests(examples: any[]): {
    passed: number;
    failed: number;
    total: number;
    results: Array<{ example_id: string; passed: boolean; errors: string[] }>;
  } {
    const results = examples.map(example => {
      const errors: string[] = [];
      let passed = true;

      for (const assertion of example.assertions) {
        const lowerAssertion = assertion.toLowerCase();
        const lowerAssistant = example.assistant.toLowerCase();

        if (lowerAssertion.startsWith('forbidden:')) {
          const forbidden = lowerAssertion.replace('forbidden:', '').trim();
          if (lowerAssistant.includes(forbidden)) {
            errors.push(`Response should not contain "${forbidden}"`);
            passed = false;
          }
        } else {
          if (!lowerAssistant.includes(lowerAssertion)) {
            errors.push(`Response missing required assertion "${assertion}"`);
            passed = false;
          }
        }
      }

      return {
        example_id: example.id || example.exampleId,
        passed,
        errors
      };
    });

    return {
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      total: examples.length,
      results
    };
  }
}
