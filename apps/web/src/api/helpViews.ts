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

export interface HelpViewState {
  pageKey: string;
  viewCount: number;
  shouldShow: boolean;
  lastViewAt: string | null;
}

export async function getHelpViewState(pageKey: string): Promise<HelpViewState> {
  const response = await fetchWithAuth(`/help-views/${pageKey}`);
  return response.json();
}

export async function incrementHelpViewCount(pageKey: string): Promise<HelpViewState> {
  const response = await fetchWithAuth(`/help-views/${pageKey}/increment`, {
    method: 'POST',
  });
  return response.json();
}

export async function resetAllHelpViews(): Promise<{ success: boolean; resetAt: string }> {
  const response = await fetchWithAuth('/help-views/reset', {
    method: 'DELETE',
  });
  return response.json();
}

export async function getAllHelpViewStates(): Promise<HelpViewState[]> {
  const response = await fetchWithAuth('/help-views');
  return response.json();
}
