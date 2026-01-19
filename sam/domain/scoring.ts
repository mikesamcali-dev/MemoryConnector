/**
 * Composite scoring logic for SAM retrieval
 */

import { ScoringWeights, ScoringSignals, ConversationTurn, UIState, RecallContext } from './types';

/**
 * Build query text from conversation and context
 */
export function buildQueryText(context: {
  current_conversation: ConversationTurn[];
  active_task: string;
  ui_state: UIState;
  lastTurns?: number;
}): string {
  const { current_conversation, active_task, ui_state, lastTurns = 8 } = context;

  const parts: string[] = [];

  // Add active task
  if (active_task && active_task.trim()) {
    parts.push(active_task.trim());
  }

  // Add recent conversation turns
  const recentTurns = current_conversation.slice(-lastTurns);
  recentTurns.forEach(turn => {
    if (turn.content && turn.content.trim()) {
      parts.push(turn.content.trim());
    }
  });

  // Add UI selection if present
  if (ui_state.selection && ui_state.selection.trim()) {
    parts.push(ui_state.selection.trim());
  }

  return parts.join(' ');
}

/**
 * Calculate exact match score based on canonical phrase hits
 */
export function exactMatchScore(queryText: string, canonicalPhrases: string[]): number {
  if (!canonicalPhrases || canonicalPhrases.length === 0) {
    return 0;
  }

  const lowerQuery = queryText.toLowerCase();
  let hitCount = 0;

  for (const phrase of canonicalPhrases) {
    if (lowerQuery.includes(phrase.toLowerCase())) {
      hitCount++;
    }
  }

  // Return fraction of phrases matched, capped at 1.0
  return Math.min(hitCount / canonicalPhrases.length, 1.0);
}

/**
 * Calculate recency score using exponential decay
 */
export function recencyScore(lastUsedAt: string | null, windowDays: number): number {
  if (!lastUsedAt) {
    return 0;
  }

  const now = new Date();
  const lastUsed = new Date(lastUsedAt);
  const daysSince = (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSince < 0) {
    return 1.0; // Future date, max score
  }

  // Exponential decay: exp(-days / window)
  return Math.exp(-daysSince / windowDays);
}

/**
 * Calculate effective confidence with decay applied
 */
export function calculateEffectiveConfidence(
  baseConfidence: number,
  updatedAt: string,
  decayPolicy: { type: string; half_life_days: number; min_confidence: number }
): number {
  if (decayPolicy.type === 'none') {
    return baseConfidence;
  }

  const now = new Date();
  const updated = new Date(updatedAt);
  const daysSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate < 0) {
    return baseConfidence;
  }

  // Exponential decay: confidence * (0.5 ^ (days / half_life))
  const decayMultiplier = Math.pow(0.5, daysSinceUpdate / decayPolicy.half_life_days);
  const effectiveConfidence = baseConfidence * decayMultiplier;

  return Math.max(effectiveConfidence, 0);
}

/**
 * Calculate composite score from signals and weights
 */
export function compositeScore(signals: ScoringSignals, weights: ScoringWeights): number {
  const score =
    weights.semantic * signals.semantic +
    weights.exact * signals.exact +
    weights.recency * signals.recency +
    weights.confidence * signals.confidence;

  return Math.max(0, Math.min(1, score)); // Clamp to [0, 1]
}

/**
 * Build explainable rationale for why a memory was recalled
 */
export function buildRationale(
  memory: { title: string; tags: string[] },
  signals: ScoringSignals,
  ui_state: UIState,
  active_task: string
): string {
  const reasons: string[] = [];

  // Find top two signals
  const signalEntries = Object.entries(signals).sort((a, b) => b[1] - a[1]);
  const topSignals = signalEntries.slice(0, 2);

  topSignals.forEach(([name, value]) => {
    if (value >= 0.7) {
      if (name === 'semantic') {
        reasons.push(`high semantic match (${round3(value)})`);
      } else if (name === 'exact') {
        reasons.push(`exact phrase match (${round3(value)})`);
      } else if (name === 'recency') {
        reasons.push(`recently used (${round3(value)})`);
      } else if (name === 'confidence') {
        reasons.push(`high confidence (${round3(value)})`);
      }
    }
  });

  // Add contextual cue
  const contextCues: string[] = [];

  if (active_task) {
    const taskLower = active_task.toLowerCase();
    const matchingTags = memory.tags.filter(tag => taskLower.includes(tag.toLowerCase()));
    if (matchingTags.length > 0) {
      contextCues.push(`relevant to ${matchingTags[0]} task`);
    }
  }

  if (ui_state.route) {
    contextCues.push(`matches current ${ui_state.route} context`);
  }

  if (contextCues.length > 0) {
    reasons.push(contextCues[0]);
  }

  const prefix = reasons.length > 0 ? 'Recalled due to' : 'Recalled';
  return `${prefix} ${reasons.join(', ')}.`;
}

/**
 * Generate highlights from query text and memory content
 */
export function makeHighlights(queryText: string, memory: { content: string; canonical_phrases: string[] }): string[] {
  const highlights: string[] = [];
  const lowerQuery = queryText.toLowerCase();
  const lowerContent = memory.content.toLowerCase();

  // Find matching canonical phrases in content
  memory.canonical_phrases.forEach(phrase => {
    const lowerPhrase = phrase.toLowerCase();
    if (lowerQuery.includes(lowerPhrase) && lowerContent.includes(lowerPhrase)) {
      const index = lowerContent.indexOf(lowerPhrase);
      if (index !== -1) {
        // Extract context around the phrase (±40 chars)
        const start = Math.max(0, index - 40);
        const end = Math.min(memory.content.length, index + lowerPhrase.length + 40);
        let snippet = memory.content.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < memory.content.length) snippet = snippet + '...';
        highlights.push(snippet);
      }
    }
  });

  return highlights.slice(0, 3); // Max 3 highlights
}

/**
 * Round number to 3 decimal places
 */
export function round3(num: number): number {
  return Math.round(num * 1000) / 1000;
}

/**
 * Detect if two memories have conflicting canonical phrases
 */
export function detectConflict(
  memory1: { canonical_phrases: string[]; tags: string[] },
  memory2: { canonical_phrases: string[]; tags: string[] }
): boolean {
  // Check if they share tags
  const sharedTags = memory1.tags.filter(tag =>
    memory2.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );

  if (sharedTags.length === 0) {
    return false; // No overlap, no conflict
  }

  // Check for contradictory phrases (very basic: look for "avoid" vs "use" same term)
  const contradictoryPairs = [
    ['avoid', 'use'],
    ['never', 'always'],
    ['prefer', 'avoid'],
    ['not', 'must']
  ];

  for (const [neg, pos] of contradictoryPairs) {
    const has1Neg = memory1.canonical_phrases.some(p => p.includes(neg));
    const has1Pos = memory1.canonical_phrases.some(p => p.includes(pos));
    const has2Neg = memory2.canonical_phrases.some(p => p.includes(neg));
    const has2Pos = memory2.canonical_phrases.some(p => p.includes(pos));

    if ((has1Neg && has2Pos) || (has1Pos && has2Neg)) {
      return true;
    }
  }

  return false;
}
