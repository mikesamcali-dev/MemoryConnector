/**
 * SAM Schema Validation Tests
 */

import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as schema from '../schema/memoryEntry.schema.json';
import { SamMemoryEntry } from '../domain/types';

describe('SAM Schema Validation', () => {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  const validEntry: SamMemoryEntry = {
    id: 'mem_12345678',
    title: 'Test Memory',
    content: 'This is a test memory with sufficient content for validation.',
    summary: 'A test memory for schema validation purposes.',
    canonical_phrases: ['test memory'],
    tags: ['test', 'validation'],
    source: { type: 'user', ref: 'test', uri: null },
    created_at: '2026-01-19T00:00:00Z',
    updated_at: '2026-01-19T00:00:00Z',
    confidence_score: 0.75,
    reliability: 'confirmed',
    usage_count: 0,
    last_used_at: null,
    context_window: { applies_to: [], excludes: [] },
    training_examples: [],
    decay_policy: { type: 'exponential', half_life_days: 90, min_confidence: 0.4 },
    archive_flag: false,
    version: 1,
    embeddings: { model: 'text-embedding-ada-002', dims: 1536, vector_ref: 'vec://mem_12345678' }
  };

  it('should validate a correct SAM entry', () => {
    const result = validate(validEntry);
    expect(result).toBe(true);
    expect(validate.errors).toBeNull();
  });

  it('should reject entry missing required field "summary"', () => {
    const invalid = { ...validEntry };
    delete (invalid as any).summary;

    const result = validate(invalid);
    expect(result).toBe(false);
    expect(validate.errors).toBeTruthy();
    expect(validate.errors!.some(e => e.message?.includes('summary'))).toBe(true);
  });

  it('should reject title that is too short', () => {
    const invalid = { ...validEntry, title: 'ab' };

    const result = validate(invalid);
    expect(result).toBe(false);
  });

  it('should reject title that is too long', () => {
    const invalid = { ...validEntry, title: 'a'.repeat(121) };

    const result = validate(invalid);
    expect(result).toBe(false);
  });

  it('should reject invalid reliability value', () => {
    const invalid = { ...validEntry, reliability: 'invalid' as any };

    const result = validate(invalid);
    expect(result).toBe(false);
  });

  it('should reject confidence_score outside [0, 1] range', () => {
    const invalid1 = { ...validEntry, confidence_score: -0.1 };
    const invalid2 = { ...validEntry, confidence_score: 1.1 };

    expect(validate(invalid1)).toBe(false);
    expect(validate(invalid2)).toBe(false);
  });

  it('should validate entry with training examples', () => {
    const withTraining = {
      ...validEntry,
      training_examples: [
        {
          id: 'tr_001',
          user: 'Test user prompt',
          assistant: 'Test assistant response',
          assertions: ['keyword1', 'keyword2'],
          last_tested_at: null,
          pass_rate: 0.0
        }
      ]
    };

    const result = validate(withTraining);
    expect(result).toBe(true);
  });

  it('should reject too many canonical phrases (max 12)', () => {
    const invalid = {
      ...validEntry,
      canonical_phrases: new Array(13).fill('phrase')
    };

    const result = validate(invalid);
    expect(result).toBe(false);
  });

  it('should reject empty canonical_phrases array', () => {
    const invalid = { ...validEntry, canonical_phrases: [] };

    const result = validate(invalid);
    expect(result).toBe(false);
  });
});
