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

export interface SpellCheckResult {
  word: string;
  suggestions: string[];
}

export async function getSpellingSuggestions(word: string): Promise<SpellCheckResult> {
  const response = await fetchWithAuth(`/spell-check/suggestions?word=${encodeURIComponent(word)}`);
  return response.json();
}

export async function addExcludedWord(word: string): Promise<{ success: boolean; word: string }> {
  const response = await fetchWithAuth('/spell-check/excluded-words', {
    method: 'POST',
    body: JSON.stringify({ word }),
  });
  return response.json();
}

export async function removeExcludedWord(word: string): Promise<{ success: boolean; word: string }> {
  const response = await fetchWithAuth(`/spell-check/excluded-words?word=${encodeURIComponent(word)}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function getExcludedWords(): Promise<{ excludedWords: string[] }> {
  const response = await fetchWithAuth('/spell-check/excluded-words');
  return response.json();
}
