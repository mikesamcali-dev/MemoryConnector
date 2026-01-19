/**
 * SAM PII Redaction Tests
 */

import { describe, it, expect } from 'vitest';
import { redactPII, redactMemoryDraft } from '../domain/redact';

describe('PII Redaction', () => {
  it('should redact email addresses', () => {
    const input = 'Contact me at bob@example.com for more info.';
    const { cleaned, report } = redactPII(input);

    expect(cleaned).toBe('Contact me at [email] for more info.');
    expect(report.total_count).toBe(1);
    expect(report.items[0].pattern).toBe('email');
    expect(report.items[0].redacted_text).toBe('bob@example.com');
  });

  it('should redact phone numbers', () => {
    const input = 'Call me at 555-123-4567 or (555) 987-6543.';
    const { cleaned, report } = redactPII(input);

    expect(cleaned).toContain('[phone]');
    expect(report.total_count).toBeGreaterThanOrEqual(1);
    expect(report.items.some(item => item.pattern === 'phone')).toBe(true);
  });

  it('should redact street addresses', () => {
    const input = 'I live at 123 Main Street in the city.';
    const { cleaned, report } = redactPII(input);

    expect(cleaned).toContain('[address]');
    expect(report.total_count).toBe(1);
    expect(report.items[0].pattern).toBe('address');
  });

  it('should redact API keys', () => {
    const input = 'Use API key: sk-1234567890abcdefghij';
    const { cleaned, report } = redactPII(input);

    expect(cleaned).toContain('[secret]');
    expect(report.total_count).toBe(1);
    expect(report.items[0].pattern).toBe('api_key');
  });

  it('should redact secrets from key-value pairs', () => {
    const input = 'password: mySecretPass123';
    const { cleaned, report } = redactPII(input);

    expect(cleaned).toBe('password: [secret]');
    expect(report.total_count).toBe(1);
    expect(report.items[0].pattern).toBe('secret');
  });

  it('should handle multiple PII types in one text', () => {
    const input = 'Email bob@example.com or call 555-1234. Address: 123 Oak Street';
    const { cleaned, report } = redactPII(input);

    expect(cleaned).toContain('[email]');
    expect(cleaned).toContain('[phone]');
    expect(cleaned).toContain('[address]');
    expect(report.total_count).toBeGreaterThanOrEqual(3);
  });

  it('should redact from memory draft', () => {
    const draft = {
      title: 'Contact Info',
      content: 'Email: alice@test.com, Phone: 555-9999'
    };

    const { draft: cleaned, report } = redactMemoryDraft(draft);

    expect(cleaned.content).toContain('[email]');
    expect(cleaned.content).toContain('[phone]');
    expect(report.total_count).toBeGreaterThanOrEqual(2);
  });

  it('should not redact safe text', () => {
    const input = 'This is completely safe text with no PII.';
    const { cleaned, report } = redactPII(input);

    expect(cleaned).toBe(input);
    expect(report.total_count).toBe(0);
  });
});
