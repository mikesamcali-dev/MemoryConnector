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

export interface TwitterPost {
  id: string;
  twitterPostId: string;
  canonicalUrl: string;
  text: string;
  thumbnailUrl: string | null;
  creatorDisplayName: string;
  creatorUsername: string | null;
  creatorId: string | null;
  publishedAt: string;
  languageCode: string | null;
  viewCount: number | null;
  likeCount: number | null;
  replyCount: number | null;
  retweetCount: number | null;
  quoteCount: number | null;
  bookmarkCount: number | null;
  hasMedia: boolean;
  mediaUrls: any | null;
  mediaTypes: any | null;
  hashtags: any | null;
  mentions: any | null;
  externalLinks: any | null;
  summary: string | null;
  topics: any | null;
  sentiment: string | null;
  isReply: boolean;
  isRetweet: boolean;
  isQuote: boolean;
  contentHash: string | null;
  ingestionStatus: string;
  ingestionAttempts: number;
  lastIngestionError: string | null;
  ingestedAt: string | null;
  lastEnrichedAt: string | null;
  capturedAt: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export async function getAllTwitterPosts(skip: number = 0, take: number = 50): Promise<TwitterPost[]> {
  const response = await fetchWithAuth(`/twitter-posts?skip=${skip}&take=${take}`);
  return response.json();
}

export async function getTwitterPost(id: string): Promise<TwitterPost> {
  const response = await fetchWithAuth(`/twitter-posts/${id}`);
  return response.json();
}

export async function getTwitterPostMemories(id: string): Promise<any[]> {
  const response = await fetchWithAuth(`/twitter-posts/${id}/memories`);
  return response.json();
}

export interface TwitterMetadata {
  twitterPostId: string;
  canonicalUrl: string;
  text: string;
  thumbnailUrl?: string;
  creatorDisplayName: string;
  creatorUsername?: string;
  creatorId?: string;
  publishedAt?: string;
  languageCode?: string;
}

export async function extractTwitterMetadata(url: string): Promise<TwitterMetadata> {
  const response = await fetchWithAuth('/twitter-posts/extract-metadata', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  return response.json();
}

export async function createTwitterPost(data: {
  twitterPostId: string;
  canonicalUrl: string;
  text: string;
  thumbnailUrl?: string;
  creatorDisplayName: string;
  creatorUsername?: string;
  creatorId?: string;
  publishedAt?: string;
  languageCode?: string;
}): Promise<TwitterPost> {
  const response = await fetchWithAuth('/twitter-posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateTwitterPost(id: string, data: Partial<TwitterPost>): Promise<TwitterPost> {
  const response = await fetchWithAuth(`/twitter-posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteTwitterPost(id: string): Promise<void> {
  await fetchWithAuth(`/twitter-posts/${id}`, {
    method: 'DELETE',
  });
}

export async function enrichTwitterPost(id: string): Promise<TwitterPost> {
  const response = await fetchWithAuth(`/twitter-posts/${id}/enrich`, {
    method: 'POST',
  });
  return response.json();
}
