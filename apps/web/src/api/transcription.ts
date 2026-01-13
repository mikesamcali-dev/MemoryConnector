import { fetchWithAuth } from './client';

export interface TranscriptionResult {
  sessionId: string;
  rawTranscript: string;
  finalTranscript: string;
  durationSeconds: number;
}

export interface LexiconTerm {
  id: string;
  term: string;
  replacement?: string;
  weight: number;
  usageCount: number;
}

/**
 * Batch transcription (upload audio file)
 */
export async function batchTranscribe(audioBlob: Blob): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const response = await fetchWithAuth('/transcription/batch', {
    method: 'POST',
    body: formData,
    headers: {}, // Don't set Content-Type for FormData
  });

  if (!response.ok) {
    throw new Error('Failed to transcribe audio');
  }

  return response.json();
}

/**
 * Submit user corrections
 */
export async function submitFeedback(
  sessionId: string,
  rawTranscript: string,
  correctedText: string,
  consentStore: boolean,
): Promise<{ success: boolean; correctionsCount: number }> {
  const response = await fetchWithAuth('/transcription/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      rawTranscript,
      correctedText,
      consentStore,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit feedback');
  }

  return response.json();
}

/**
 * Get user lexicon
 */
export async function getUserLexicon(): Promise<LexiconTerm[]> {
  const response = await fetchWithAuth('/transcription/lexicon');
  if (!response.ok) {
    throw new Error('Failed to fetch lexicon');
  }
  return response.json();
}

/**
 * Add term to lexicon
 */
export async function addLexiconTerm(
  term: string,
  replacement?: string,
  weight = 1.0,
): Promise<LexiconTerm> {
  const response = await fetchWithAuth('/transcription/lexicon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ term, replacement, weight }),
  });

  if (!response.ok) {
    throw new Error('Failed to add lexicon term');
  }

  return response.json();
}

/**
 * Remove term from lexicon
 */
export async function removeLexiconTerm(term: string): Promise<void> {
  const response = await fetchWithAuth(`/transcription/lexicon/${encodeURIComponent(term)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to remove lexicon term');
  }
}
