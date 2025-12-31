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

export interface MemoryRelationship {
  id: string;
  relationshipType: string;
  createdAt: string;
  relatedMemory: {
    id: string;
    textContent: string;
    createdAt: string;
    type: {
      id: string;
      name: string;
      icon: string;
      color: string;
    } | null;
  };
}

export interface CreateMemoryRelationshipDto {
  sourceMemoryId: string;
  relatedMemoryId: string;
  relationshipType?: 'related' | 'continuation' | 'reference' | 'duplicate';
}

export async function createMemoryRelationship(
  data: CreateMemoryRelationshipDto
): Promise<MemoryRelationship> {
  const response = await fetchWithAuth('/memory-relationships', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function getMemoryRelationships(memoryId: string): Promise<MemoryRelationship[]> {
  const response = await fetchWithAuth(`/memory-relationships/memory/${memoryId}`);
  return response.json();
}

export async function deleteMemoryRelationship(relationshipId: string): Promise<void> {
  await fetchWithAuth(`/memory-relationships/${relationshipId}`, {
    method: 'DELETE',
  });
}
