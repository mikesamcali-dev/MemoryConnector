/**
 * PII redaction for SAM entries
 */

import { RedactionItem, RedactionReport } from './types';

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_REGEX = /(\+\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g;
const ADDRESS_REGEX = /\d+\s+([A-Z][a-z]+\s+){1,3}(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way)\b/gi;
const API_KEY_REGEX = /\b(sk|pk|api)[-_]?[a-zA-Z0-9]{16,}\b/g;
const SECRET_REGEX = /\b(token|secret|password|apikey|api_key)[\s:=]+[^\s]{8,}/gi;

export interface RedactedResult {
  cleaned: string;
  report: RedactionReport;
}

/**
 * Redact PII from text according to SAM rules
 */
export function redactPII(text: string, fieldPath: string = 'content'): RedactedResult {
  const items: RedactionItem[] = [];
  let cleaned = text;

  // Email addresses
  const emailMatches = [...text.matchAll(EMAIL_REGEX)];
  if (emailMatches.length > 0) {
    cleaned = cleaned.replace(EMAIL_REGEX, '[email]');
    emailMatches.forEach(match => {
      items.push({
        path: fieldPath,
        pattern: 'email',
        redacted_text: match[0]
      });
    });
  }

  // Phone numbers
  const phoneMatches = [...text.matchAll(PHONE_REGEX)];
  if (phoneMatches.length > 0) {
    cleaned = cleaned.replace(PHONE_REGEX, '[phone]');
    phoneMatches.forEach(match => {
      items.push({
        path: fieldPath,
        pattern: 'phone',
        redacted_text: match[0]
      });
    });
  }

  // Street addresses
  const addressMatches = [...text.matchAll(ADDRESS_REGEX)];
  if (addressMatches.length > 0) {
    cleaned = cleaned.replace(ADDRESS_REGEX, '[address]');
    addressMatches.forEach(match => {
      items.push({
        path: fieldPath,
        pattern: 'address',
        redacted_text: match[0]
      });
    });
  }

  // API keys/secrets
  const apiKeyMatches = [...text.matchAll(API_KEY_REGEX)];
  if (apiKeyMatches.length > 0) {
    cleaned = cleaned.replace(API_KEY_REGEX, '[secret]');
    apiKeyMatches.forEach(match => {
      items.push({
        path: fieldPath,
        pattern: 'api_key',
        redacted_text: match[0]
      });
    });
  }

  // Generic secrets
  const secretMatches = [...text.matchAll(SECRET_REGEX)];
  if (secretMatches.length > 0) {
    cleaned = cleaned.replace(SECRET_REGEX, (match) => {
      const parts = match.split(/[\s:=]+/);
      return parts[0] + ': [secret]';
    });
    secretMatches.forEach(match => {
      items.push({
        path: fieldPath,
        pattern: 'secret',
        redacted_text: match[0]
      });
    });
  }

  return {
    cleaned,
    report: {
      items,
      total_count: items.length
    }
  };
}

/**
 * Redact PII from a full memory draft
 */
export function redactMemoryDraft<T extends { title?: string; content?: string }>(
  draft: T
): { draft: T; report: RedactionReport } {
  const allItems: RedactionItem[] = [];
  const cleaned = { ...draft };

  if (draft.title) {
    const { cleaned: cleanTitle, report } = redactPII(draft.title, 'title');
    cleaned.title = cleanTitle;
    allItems.push(...report.items);
  }

  if (draft.content) {
    const { cleaned: cleanContent, report } = redactPII(draft.content, 'content');
    cleaned.content = cleanContent;
    allItems.push(...report.items);
  }

  return {
    draft: cleaned,
    report: {
      items: allItems,
      total_count: allItems.length
    }
  };
}
