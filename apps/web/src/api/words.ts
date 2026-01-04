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

export interface WordWithCount {
  id: string;
  word: string;
  count: number;
}

export interface WordDetail {
  id: string;
  word: string;
  description: string | null;
  phonetic: string | null;
  partOfSpeech: string | null;
  etymology: string | null;
  examples: string[] | null;
  synonyms: string[] | null;
  antonyms: string[] | null;
  difficulty: string | null;
  lastEnrichedAt: string | null;
  createdAt: string;
  updatedAt: string;
  memoryLinks?: Array<{
    id: string;
    memory: {
      id: string;
      body: string;
      createdAt: string;
      userId: string;
    };
    createdAt: string;
  }>;
}

export async function getAllWords(): Promise<WordWithCount[]> {
  const response = await fetchWithAuth('/words');
  return response.json();
}

export async function getWordById(id: string): Promise<WordDetail> {
  const response = await fetchWithAuth(`/words/${id}`);
  return response.json();
}

export async function lookupWordByText(word: string): Promise<WordDetail | null> {
  const response = await fetchWithAuth(`/words/lookup/${encodeURIComponent(word)}`);
  return response.json();
}
