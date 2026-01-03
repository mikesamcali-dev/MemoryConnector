const API_BASE = '/api/v1';

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('accessToken');
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshResponse.ok) {
      const { accessToken } = await refreshResponse.json();
      localStorage.setItem('accessToken', accessToken);
      headers.set('Authorization', `Bearer ${accessToken}`);
      return fetch(`${API_BASE}${url}`, { ...options, headers, credentials: 'include' });
    }
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response;
}

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewMemory {
  id: string;
  title?: string;
  body?: string;
  createdAt: string;
  reviewCount: number;
  lapseCount: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  reviewInterval?: number;
  easeFactor?: number;
  location?: {
    id: string;
    name: string;
  };
  person?: {
    id: string;
    displayName: string;
  };
  wordLinks?: Array<{
    word: {
      id: string;
      word: string;
      description?: string;
    };
  }>;
}

export interface ReviewStats {
  currentStreakDays: number;
  longestStreakDays: number;
  totalReviewsCompleted: number;
  totalReviewsAgain: number;
  totalReviewsHard: number;
  totalReviewsGood: number;
  totalReviewsEasy: number;
  recallSuccessRate: number;
}

export async function getDueReviews(limit: number = 20): Promise<{ reviews: ReviewMemory[]; count: number }> {
  const response = await fetchWithAuth(`/reviews/due?limit=${limit}`);
  return response.json();
}

export async function getReviewStats(): Promise<ReviewStats> {
  const response = await fetchWithAuth('/reviews/stats');
  return response.json();
}

export async function getDueCount(): Promise<{ count: number }> {
  const response = await fetchWithAuth('/reviews/count');
  return response.json();
}

export async function submitReview(memoryId: string, rating: ReviewRating) {
  const response = await fetchWithAuth('/reviews/submit', {
    method: 'POST',
    body: JSON.stringify({ memoryId, rating }),
  });
  return response.json();
}
