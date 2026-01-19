/**
 * SAM Micro-Training Tests
 */

import { describe, it, expect } from 'vitest';
import { TrainingService } from '../services/TrainingService';
import { SamTrainingExample } from '../domain/types';

describe('SAM Micro-Training', () => {
  const trainingService = new TrainingService();

  describe('suggestTrainingExamples', () => {
    it('should generate training examples from memory', async () => {
      const suggestion = {
        title: 'Use MudSnackbar for alerts',
        content: 'Prefer MudSnackbar over MudDialog for simple alert notifications in Blazor.',
        canonical_phrases: [
          'use mudsnackbar for alerts',
          'prefer snackbar over dialog',
          'avoid muddialog for alerts'
        ]
      };

      const examples = await trainingService.suggestTrainingExamples(suggestion);

      expect(examples.length).toBeGreaterThan(0);
      expect(examples.length).toBeLessThanOrEqual(3);

      examples.forEach(example => {
        expect(example.id).toBeTruthy();
        expect(example.user).toBeTruthy();
        expect(example.assistant).toBeTruthy();
        expect(example.assertions).toBeDefined();
        expect(example.last_tested_at).toBeNull();
        expect(example.pass_rate).toBe(0.0);
      });
    });

    it('should include canonical phrases in assertions', async () => {
      const suggestion = {
        title: 'API Best Practice',
        content: 'Always validate input',
        canonical_phrases: ['validate input', 'check parameters']
      };

      const examples = await trainingService.suggestTrainingExamples(suggestion);

      expect(examples.some(ex =>
        ex.assertions.some(a => a.includes('validate') || a.includes('input'))
      )).toBe(true);
    });
  });

  describe('runTrainingTests', () => {
    it('should pass when assertions are met', async () => {
      const examples: SamTrainingExample[] = [
        {
          id: 'tr_001',
          user: 'Show an alert',
          assistant: 'Use MudSnackbar for the alert notification',
          assertions: ['MudSnackbar', 'alert'],
          last_tested_at: null,
          pass_rate: 0.0
        }
      ];

      const report = await trainingService.runTrainingTests({
        draft: { training_examples: examples },
        canonical_phrases: ['use mudsnackbar']
      });

      expect(report.passed).toBe(1);
      expect(report.failed).toBe(0);
      expect(report.total).toBe(1);
      expect(report.results[0].passed).toBe(true);
      expect(report.results[0].errors).toHaveLength(0);
    });

    it('should fail when assertions are missing', async () => {
      const examples: SamTrainingExample[] = [
        {
          id: 'tr_002',
          user: 'Show an alert',
          assistant: 'Use a dialog box',
          assertions: ['MudSnackbar'],
          last_tested_at: null,
          pass_rate: 0.0
        }
      ];

      const report = await trainingService.runTrainingTests({
        draft: { training_examples: examples },
        canonical_phrases: []
      });

      expect(report.passed).toBe(0);
      expect(report.failed).toBe(1);
      expect(report.results[0].passed).toBe(false);
      expect(report.results[0].errors.length).toBeGreaterThan(0);
    });

    it('should handle forbidden assertions', async () => {
      const examples: SamTrainingExample[] = [
        {
          id: 'tr_003',
          user: 'Show an alert',
          assistant: 'Use MudDialog for alerts',
          assertions: ['forbidden:MudDialog'],
          last_tested_at: null,
          pass_rate: 0.0
        }
      ];

      const report = await trainingService.runTrainingTests({
        draft: { training_examples: examples },
        canonical_phrases: []
      });

      expect(report.failed).toBe(1);
      expect(report.results[0].errors.some(e => e.includes('should not contain'))).toBe(true);
    });

    it('should pass when forbidden terms are absent', async () => {
      const examples: SamTrainingExample[] = [
        {
          id: 'tr_004',
          user: 'Show an alert',
          assistant: 'Use MudSnackbar for this notification',
          assertions: ['MudSnackbar', 'forbidden:MudDialog'],
          last_tested_at: null,
          pass_rate: 0.0
        }
      ];

      const report = await trainingService.runTrainingTests({
        draft: { training_examples: examples },
        canonical_phrases: []
      });

      expect(report.passed).toBe(1);
      expect(report.results[0].passed).toBe(true);
    });
  });

  describe('updatePassRates', () => {
    it('should update pass rates based on test report', () => {
      const examples: SamTrainingExample[] = [
        {
          id: 'tr_001',
          user: 'Test',
          assistant: 'Response',
          assertions: [],
          last_tested_at: null,
          pass_rate: 0.0
        }
      ];

      const report = {
        passed: 1,
        failed: 0,
        total: 1,
        results: [{ example_id: 'tr_001', passed: true, errors: [] }]
      };

      const updated = trainingService.updatePassRates(examples, report);

      expect(updated[0].last_tested_at).toBeTruthy();
      expect(updated[0].pass_rate).toBe(1.0);
    });
  });
});
