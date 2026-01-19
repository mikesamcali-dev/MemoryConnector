/**
 * SAM Scoring Tests
 */

import { describe, it, expect } from 'vitest';
import {
  exactMatchScore,
  recencyScore,
  compositeScore,
  buildQueryText,
  buildRationale,
  round3
} from '../domain/scoring';
import { ConversationTurn, ScoringWeights } from '../domain/types';

describe('SAM Scoring', () => {
  describe('exactMatchScore', () => {
    it('should return 1.0 for full match', () => {
      const query = 'use mudsnackbar for alerts';
      const phrases = ['use mudsnackbar for alerts'];

      expect(exactMatchScore(query, phrases)).toBe(1.0);
    });

    it('should return 0.5 for partial match', () => {
      const query = 'use mudsnackbar for alerts';
      const phrases = ['use mudsnackbar for alerts', 'another phrase'];

      expect(exactMatchScore(query, phrases)).toBe(0.5);
    });

    it('should return 0 for no match', () => {
      const query = 'unrelated text';
      const phrases = ['use mudsnackbar', 'prefer snackbar'];

      expect(exactMatchScore(query, phrases)).toBe(0);
    });

    it('should be case insensitive', () => {
      const query = 'USE MUDSNACKBAR';
      const phrases = ['use mudsnackbar'];

      expect(exactMatchScore(query, phrases)).toBe(1.0);
    });
  });

  describe('recencyScore', () => {
    it('should return 1.0 for very recent usage', () => {
      const lastUsed = new Date().toISOString();
      const score = recencyScore(lastUsed, 30);

      expect(score).toBeGreaterThan(0.99);
    });

    it('should return lower score for older usage', () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const score = recencyScore(thirtyDaysAgo, 30);

      expect(score).toBeCloseTo(Math.exp(-1), 2);
    });

    it('should return 0 for never used', () => {
      expect(recencyScore(null, 30)).toBe(0);
    });
  });

  describe('compositeScore', () => {
    const weights: ScoringWeights = {
      semantic: 0.50,
      exact: 0.20,
      recency: 0.15,
      confidence: 0.15
    };

    it('should calculate correct composite score', () => {
      const signals = {
        semantic: 0.82,
        exact: 0.10,
        recency: 0.60,
        confidence: 0.85
      };

      const score = compositeScore(signals, weights);
      const expected = 0.50 * 0.82 + 0.20 * 0.10 + 0.15 * 0.60 + 0.15 * 0.85;

      expect(score).toBeCloseTo(expected, 4);
      expect(score).toBeCloseTo(0.6475, 4);
    });

    it('should clamp scores to [0, 1]', () => {
      const highSignals = {
        semantic: 2.0,
        exact: 2.0,
        recency: 2.0,
        confidence: 2.0
      };

      expect(compositeScore(highSignals, weights)).toBeLessThanOrEqual(1.0);

      const negativeSignals = {
        semantic: -1.0,
        exact: -1.0,
        recency: -1.0,
        confidence: -1.0
      };

      expect(compositeScore(negativeSignals, weights)).toBeGreaterThanOrEqual(0.0);
    });
  });

  describe('buildQueryText', () => {
    it('should combine conversation turns and active task', () => {
      const turns: ConversationTurn[] = [
        { speaker: 'user', content: 'Hello' },
        { speaker: 'assistant', content: 'Hi there' },
        { speaker: 'user', content: 'Show alert' }
      ];

      const queryText = buildQueryText({
        current_conversation: turns,
        active_task: 'Implement notifications',
        ui_state: {},
        lastTurns: 8
      });

      expect(queryText).toContain('Implement notifications');
      expect(queryText).toContain('Hello');
      expect(queryText).toContain('Show alert');
    });

    it('should limit to recent turns', () => {
      const turns: ConversationTurn[] = new Array(20).fill(null).map((_, i) => ({
        speaker: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`
      }));

      const queryText = buildQueryText({
        current_conversation: turns,
        active_task: '',
        ui_state: {},
        lastTurns: 5
      });

      expect(queryText).toContain('Message 19');
      expect(queryText).toContain('Message 15');
      expect(queryText).not.toContain('Message 10');
    });

    it('should include UI selection', () => {
      const queryText = buildQueryText({
        current_conversation: [],
        active_task: 'Task',
        ui_state: { selection: 'Selected text' },
        lastTurns: 8
      });

      expect(queryText).toContain('Selected text');
    });
  });

  describe('buildRationale', () => {
    it('should mention top signals', () => {
      const memory = { title: 'Test', tags: ['ui'] };
      const signals = {
        semantic: 0.92,
        exact: 0.15,
        recency: 0.20,
        confidence: 0.85
      };

      const rationale = buildRationale(memory, signals, {}, 'UI task');

      expect(rationale).toContain('semantic');
      expect(rationale).toContain('0.92');
    });

    it('should include contextual cues', () => {
      const memory = { title: 'Test', tags: ['ui', 'blazor'] };
      const signals = {
        semantic: 0.80,
        exact: 0.10,
        recency: 0.50,
        confidence: 0.75
      };

      const rationale = buildRationale(memory, signals, { route: 'editor' }, 'Working on UI components');

      expect(rationale.toLowerCase()).toContain('ui');
    });
  });

  describe('round3', () => {
    it('should round to 3 decimal places', () => {
      expect(round3(0.123456)).toBe(0.123);
      expect(round3(0.999999)).toBe(1.000);
      expect(round3(0.1)).toBe(0.100);
    });
  });
});
