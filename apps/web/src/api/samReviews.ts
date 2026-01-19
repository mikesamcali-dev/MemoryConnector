import { fetchWithAuth } from './client';

export interface ReviewSchedule {
  id: string;
  memoryId: string;
  userId: string;
  currentInterval: number;
  easeFactor: number;
  nextReviewDate: string;
  totalReviews: number;
  successfulReviews: number;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
  isPaused: boolean;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  memory: {
    id: string;
    title: string;
    content: string;
    summary: string;
    canonicalPhrases: string[];
    tags: string[];
    confidenceScore: number;
    reliability: string;
  };
}

export interface RecordReviewDto {
  wasSuccessful: boolean;
  reviewType: 'recognition' | 'free_recall';
  responseTimeMs?: number;
}

export interface ReviewStats {
  totalReviews: number;
  successfulReviews: number;
  successRate: number;
  retention7Day: number;
  retention30Day: number;
}

export async function getDueReviews(limit: number = 20): Promise<ReviewSchedule[]> {
  const response = await fetchWithAuth(`/sam/reviews/due?limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to fetch due reviews');
  }

  return response.json();
}

export async function getDueReviewCount(): Promise<{ count: number }> {
  const response = await fetchWithAuth('/sam/reviews/due/count');

  if (!response.ok) {
    throw new Error('Failed to fetch due review count');
  }

  return response.json();
}

export async function recordReview(
  scheduleId: string,
  dto: RecordReviewDto
): Promise<{ newInterval: number; nextReviewDate: string }> {
  const response = await fetchWithAuth(`/sam/reviews/${scheduleId}/record`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error('Failed to record review');
  }

  return response.json();
}

export async function pauseReviewSchedule(scheduleId: string): Promise<void> {
  const response = await fetchWithAuth(`/sam/reviews/${scheduleId}/pause`, {
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error('Failed to pause review schedule');
  }
}

export async function resumeReviewSchedule(scheduleId: string): Promise<void> {
  const response = await fetchWithAuth(`/sam/reviews/${scheduleId}/resume`, {
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error('Failed to resume review schedule');
  }
}

export async function getReviewStats(): Promise<ReviewStats> {
  const response = await fetchWithAuth('/sam/reviews/stats');

  if (!response.ok) {
    throw new Error('Failed to fetch review stats');
  }

  return response.json();
}
