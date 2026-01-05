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

export interface SearchResult {
  memories: any[];
  method: 'semantic' | 'keyword';
  degraded: boolean;
  query: string;
  totalCount: number;
}

export interface UnifiedSearchResults {
  query: string;
  memories: {
    results: any[];
    count: number;
    method: 'semantic' | 'keyword';
    degraded: boolean;
  };
  projects: {
    results: Array<{
      id: string;
      name: string;
      description?: string;
      tags?: string[];
      createdAt: string;
      updatedAt: string;
      _count: { memoryLinks: number };
    }>;
    count: number;
  };
  images: {
    results: Array<{
      id: string;
      storageUrl: string;
      thumbnailUrl256?: string;
      contentType: string;
      capturedAt?: string;
      createdAt: string;
    }>;
    count: number;
  };
  urlPages: {
    results: Array<{
      id: string;
      url: string;
      title?: string;
      description?: string;
      siteName?: string;
      imageUrl?: string;
      createdAt: string;
    }>;
    count: number;
  };
  youtubeVideos: {
    results: Array<{
      id: string;
      youtubeVideoId: string;
      title: string;
      creatorDisplayName: string;
      thumbnailUrl?: string;
      publishedAt: string;
    }>;
    count: number;
  };
  tiktokVideos: {
    results: Array<{
      id: string;
      tiktokVideoId: string;
      title: string;
      creatorDisplayName: string;
      thumbnailUrl?: string;
      publishedAt?: string;
    }>;
    count: number;
  };
  people: {
    results: Array<{
      id: string;
      displayName: string;
      email?: string;
      phone?: string;
      createdAt: string;
    }>;
    count: number;
  };
  locations: {
    results: Array<{
      id: string;
      name: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
      createdAt: string;
    }>;
    count: number;
  };
  totalResults: number;
}

export async function searchMemories(query: string): Promise<SearchResult> {
  const response = await fetchWithAuth(`/search?q=${encodeURIComponent(query)}`);
  return response.json();
}

export async function searchAll(query: string, limit = 5): Promise<UnifiedSearchResults> {
  const response = await fetchWithAuth(`/search/all?q=${encodeURIComponent(query)}&limit=${limit}`);
  return response.json();
}

