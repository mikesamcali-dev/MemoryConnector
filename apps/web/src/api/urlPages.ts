const API_BASE = '/api/v1';

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('accessToken');
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });
}

export interface UrlPage {
  id: string;
  userId: string;
  url: string;
  urlHash: string;
  title?: string;
  description?: string;
  summary?: string;
  content?: string;
  author?: string;
  publishedAt?: string;
  siteName?: string;
  imageUrl?: string;
  tags?: string[];
  metadata?: {
    category?: string;
    keyPoints?: string[];
    sentiment?: string;
  };
  fetchedAt: string;
  createdAt: string;
  updatedAt: string;
  memoryLinks?: Array<{
    id: string;
    memoryId: string;
    urlPageId: string;
    createdAt: string;
    memory: {
      id: string;
      title?: string;
      body?: string;
      createdAt: string;
    };
  }>;
  aiAnalysis?: {
    summary?: string;
    tags?: string[];
    category?: string;
    keyPoints?: string[];
    sentiment?: string;
  };
  isDuplicate?: boolean;
  message?: string;
}

export interface AddUrlDto {
  url: string;
}

export async function addUrl(data: AddUrlDto): Promise<UrlPage> {
  const response = await fetchWithAuth('/url-pages/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add URL');
  }

  return response.json();
}

export async function getUserUrlPages(skip = 0, take = 20): Promise<UrlPage[]> {
  const response = await fetchWithAuth(`/url-pages?skip=${skip}&take=${take}`);

  if (!response.ok) {
    throw new Error('Failed to fetch URL pages');
  }

  return response.json();
}

export async function getUrlPageById(urlPageId: string): Promise<UrlPage> {
  const response = await fetchWithAuth(`/url-pages/${urlPageId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch URL page');
  }

  return response.json();
}

export async function linkUrlPageToMemory(urlPageId: string, memoryId: string): Promise<any> {
  const response = await fetchWithAuth('/url-pages/link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urlPageId, memoryId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to link URL page to memory');
  }

  return response.json();
}

export async function linkUrlPagesToMemory(memoryId: string, urlPageIds: string[]): Promise<any> {
  const response = await fetchWithAuth('/url-pages/link-multiple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memoryId, urlPageIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to link URL pages to memory');
  }

  return response.json();
}

export async function deleteUrlPage(urlPageId: string): Promise<void> {
  const response = await fetchWithAuth(`/url-pages/${urlPageId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete URL page');
  }
}
