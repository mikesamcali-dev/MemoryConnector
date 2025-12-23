import { generateIdempotencyKey } from '../utils/idempotency';

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
    // Try to refresh
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

export interface Memory {
  id: string;
  textContent?: string;
  imageUrl?: string;
  type?: string;
  state: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoryDto {
  textContent?: string;
  imageUrl?: string;
  type?: string;
}

export async function createMemory(draft: { text?: string; imageUrl?: string; idempotencyKey: string }): Promise<Memory> {
  const response = await fetchWithAuth('/memories', {
    method: 'POST',
    headers: {
      'Idempotency-Key': draft.idempotencyKey,
    },
    body: JSON.stringify({
      textContent: draft.text,
      imageUrl: draft.imageUrl,
    }),
  });

  const replayed = response.headers.get('X-Idempotency-Replayed') === 'true';
  if (replayed) {
    console.log('Idempotent replay detected');
  }

  return response.json();
}

export async function getMemories(skip = 0, take = 20): Promise<Memory[]> {
  const response = await fetchWithAuth(`/memories?skip=${skip}&take=${take}`);
  return response.json();
}

