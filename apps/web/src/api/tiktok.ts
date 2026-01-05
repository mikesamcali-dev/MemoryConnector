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
    const errorWithStatus = new Error(error.message || 'Request failed') as Error & { status: number };
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  return response;
}

export interface TikTokVideo {
  id: string;
  tiktokVideoId: string;
  canonicalUrl: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  creatorDisplayName: string;
  creatorUsername: string | null;
  creatorId: string | null;
  publishedAt: string | null;
  durationSeconds: number | null;
  summary: string | null;
  transcript: string | null;
  extractedData: any | null;
  topics: any | null;
  musicInfo: any | null;
  viewCount: number | null;
  likeCount: number | null;
  shareCount: number | null;
  commentCount: number | null;
  capturedAt: string | null;
  hashtags: any | null;
  mentions: any | null;
  externalLinks: any | null;
  contentHash: string | null;
  ingestionStatus: string;
  ingestionAttempts: number;
  lastIngestionError: string | null;
  ingestedAt: string | null;
  lastEnrichedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getAllTikTokVideos(skip: number = 0, take: number = 50): Promise<TikTokVideo[]> {
  const response = await fetchWithAuth(`/tiktok-videos?skip=${skip}&take=${take}`);
  return response.json();
}

export async function getTikTokVideo(id: string): Promise<TikTokVideo> {
  const response = await fetchWithAuth(`/tiktok-videos/${id}`);
  return response.json();
}

export async function getTikTokVideoMemories(id: string): Promise<any[]> {
  const response = await fetchWithAuth(`/tiktok-videos/${id}/memories`);
  return response.json();
}

export interface TikTokMetadata {
  tiktokVideoId: string;
  canonicalUrl: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  creatorDisplayName: string;
  creatorUsername?: string;
  creatorId?: string;
  publishedAt?: string;
  durationSeconds?: number;
  transcript?: string;
}

export async function extractTikTokMetadata(url: string): Promise<TikTokMetadata> {
  const response = await fetchWithAuth('/tiktok-videos/extract-metadata', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  return response.json();
}

export async function createTikTokVideo(data: {
  tiktokVideoId: string;
  canonicalUrl: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  creatorDisplayName: string;
  creatorUsername?: string;
  creatorId?: string;
  publishedAt?: string;
  durationSeconds?: number;
  transcript?: string;
}): Promise<TikTokVideo> {
  const response = await fetchWithAuth('/tiktok-videos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateTikTokVideo(id: string, data: Partial<TikTokVideo>): Promise<TikTokVideo> {
  const response = await fetchWithAuth(`/tiktok-videos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteTikTokVideo(id: string): Promise<void> {
  await fetchWithAuth(`/tiktok-videos/${id}`, {
    method: 'DELETE',
  });
}

export async function enrichTikTokVideo(id: string): Promise<TikTokVideo> {
  const response = await fetchWithAuth(`/tiktok-videos/${id}/enrich`, {
    method: 'POST',
  });
  return response.json();
}
