/**
 * Text normalization and sanitization for SAM entries
 */

export interface NormalizedText {
  original: string;
  cleaned: string;
  changes: string[];
}

/**
 * Normalize text for storage
 * - Trim whitespace
 * - Normalize internal spacing to single spaces
 * - Preserve original casing (lowercase applied separately for canonical phrases)
 */
export function normalizeText(text: string): NormalizedText {
  const original = text;
  const changes: string[] = [];

  let cleaned = text;

  // Trim leading/trailing whitespace
  if (cleaned !== cleaned.trim()) {
    changes.push('trimmed_whitespace');
    cleaned = cleaned.trim();
  }

  // Normalize internal whitespace to single spaces
  const beforeSpaceNorm = cleaned;
  cleaned = cleaned.replace(/\s+/g, ' ');
  if (beforeSpaceNorm !== cleaned) {
    changes.push('normalized_spacing');
  }

  return { original, cleaned, changes };
}

/**
 * Normalize canonical phrases - always lowercase
 */
export function normalizeCanonicalPhrase(phrase: string): string {
  return normalizeText(phrase).cleaned.toLowerCase();
}

/**
 * Normalize a draft memory entry for storage
 */
export function normalizeForStorage<T extends Record<string, any>>(draft: T): T {
  const normalized = { ...draft };

  if (typeof normalized.title === 'string') {
    normalized.title = normalizeText(normalized.title).cleaned;
  }

  if (typeof normalized.content === 'string') {
    normalized.content = normalizeText(normalized.content).cleaned;
  }

  if (Array.isArray(normalized.canonical_phrases)) {
    normalized.canonical_phrases = normalized.canonical_phrases.map(normalizeCanonicalPhrase);
  }

  if (Array.isArray(normalized.tags)) {
    normalized.tags = normalized.tags.map((tag: string) =>
      normalizeText(tag).cleaned.toLowerCase()
    );
  }

  return normalized;
}

/**
 * Validate text length constraints
 */
export function validateLength(
  text: string,
  min: number,
  max: number,
  fieldName: string
): { valid: boolean; error?: string } {
  if (text.length < min) {
    return { valid: false, error: `${fieldName} must be at least ${min} characters` };
  }
  if (text.length > max) {
    return { valid: false, error: `${fieldName} must be at most ${max} characters` };
  }
  return { valid: true };
}
