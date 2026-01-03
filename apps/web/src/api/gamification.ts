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

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'capture' | 'review' | 'streak' | 'network' | 'special';
  unlocked: boolean;
  progress: number;
  reward?: string;
}

export interface AchievementsResponse {
  achievements: Achievement[];
  unlockedCount: number;
  totalCount: number;
  progress: number;
}

export async function getAchievements(): Promise<AchievementsResponse> {
  const response = await fetchWithAuth('/gamification/achievements');
  return response.json();
}
