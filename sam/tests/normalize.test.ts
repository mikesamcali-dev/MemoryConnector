/**
 * SAM Normalization Tests
 */

import { describe, it, expect } from 'vitest';
import { normalizeText, normalizeCanonicalPhrase, normalizeForStorage } from '../domain/normalize';

describe('Text Normalization', () => {
  it('should trim whitespace', () => {
    const input = '  Hello World  ';
    const { cleaned, changes } = normalizeText(input);

    expect(cleaned).toBe('Hello World');
    expect(changes).toContain('trimmed_whitespace');
  });

  it('should normalize internal spacing', () => {
    const input = 'Hello   World    Test';
    const { cleaned, changes } = normalizeText(input);

    expect(cleaned).toBe('Hello World Test');
    expect(changes).toContain('normalized_spacing');
  });

  it('should preserve original casing', () => {
    const input = 'Hello World';
    const { cleaned } = normalizeText(input);

    expect(cleaned).toBe('Hello World');
  });

  it('should lowercase canonical phrases', () => {
    const input = '  Prefer   MudDialog  ';
    const normalized = normalizeCanonicalPhrase(input);

    expect(normalized).toBe('prefer muddialog');
  });

  it('should normalize memory draft', () => {
    const draft = {
      title: '  Test   Title  ',
      content: '  Test   content   here  ',
      canonical_phrases: ['  Phrase   One  ', 'Phrase Two'],
      tags: ['  Tag1  ', 'Tag2']
    };

    const normalized = normalizeForStorage(draft);

    expect(normalized.title).toBe('Test Title');
    expect(normalized.content).toBe('Test content here');
    expect(normalized.canonical_phrases).toEqual(['phrase one', 'phrase two']);
    expect(normalized.tags).toEqual(['tag1', 'tag2']);
  });

  it('should handle already normalized text', () => {
    const input = 'Already normalized';
    const { cleaned, changes } = normalizeText(input);

    expect(cleaned).toBe(input);
    expect(changes).toHaveLength(0);
  });
});
