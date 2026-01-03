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
    const errorWithStatus = new Error(error.message || 'Request failed') as Error & { status: number };
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  return response;
}

export interface Memory {
  id: string;
  textContent?: string;
  title?: string;
  body?: string;
  data?: any;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  typeId?: string;
  type?: MemoryType;
  wordLinks?: {
    id: string;
    createdAt: string;
    word: {
      id: string;
      word: string;
      description: string | null;
      phonetic: string | null;
      imageUrl: string | null;
      partOfSpeech: string | null;
      etymology: string | null;
      examples: string[] | null;
      synonyms: string[] | null;
      antonyms: string[] | null;
      difficulty: string | null;
      lastEnrichedAt: string | null;
    };
  }[];
  imageLinks?: {
    id: string;
    createdAt: string;
    image: {
      id: string;
      storageUrl: string;
      thumbnailUrl256?: string;
      thumbnailUrl1024?: string;
      contentType: string;
      width?: number;
      height?: number;
      capturedAt?: string;
    };
  }[];
  urlPageLinks?: {
    id: string;
    createdAt: string;
    urlPage: {
      id: string;
      url: string;
      title?: string;
      description?: string;
      summary?: string;
      author?: string;
      publishedAt?: string;
      siteName?: string;
      imageUrl?: string;
      tags?: string[];
      fetchedAt: string;
    };
  }[];
  event?: {
    id: string;
    name: string;
    description: string | null;
    eventDate: string | null;
    location: string | null;
    imageUrl: string | null;
    tags: string[] | null;
    lastEnrichedAt: string | null;
  };
  location?: {
    id: string;
    name: string;
    description: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    placeType: string | null;
    imageUrl: string | null;
    lastEnrichedAt: string | null;
  };
  person?: {
    id: string;
    displayName: string;
    email: string | null;
    phone: string | null;
    notes: string | null;
    imageUrl: string | null;
    lastEnrichedAt: string | null;
  };
  youtubeVideo?: {
    id: string;
    title: string;
    description: string | null;
    creatorDisplayName: string | null;
    thumbnailUrl: string | null;
    publishedAt: string | null;
    duration: string | null;
    viewCount: number | null;
    likeCount: number | null;
    commentCount: number | null;
    favoriteCount: number | null;
    license: string | null;
    madeForKids: boolean | null;
    captionAvailable: boolean | null;
    capturedAt: string | null;
  };
  tiktokVideo?: {
    id: string;
    title: string;
    description: string | null;
    creatorDisplayName: string;
    creatorUsername: string | null;
    thumbnailUrl: string | null;
    publishedAt: string | null;
    durationSeconds: number | null;
    viewCount: number | null;
    likeCount: number | null;
    shareCount: number | null;
    commentCount: number | null;
  };
  sourceRelationships?: {
    id: string;
    relationshipType: string;
    createdAt: string;
    relatedMemory: {
      id: string;
      textContent: string;
      createdAt: string;
      type: MemoryType | null;
    };
  }[];
  relatedFromMemories?: {
    id: string;
    relationshipType: string;
    createdAt: string;
    sourceMemory: {
      id: string;
      textContent: string;
      createdAt: string;
      type: MemoryType | null;
    };
  }[];
  linksFrom?: {
    id: string;
    linkType: string;
    createdAt: string;
    target: {
      id: string;
      title: string | null;
      body: string | null;
      createdAt: string;
      typeAssignments?: {
        memoryType: MemoryType;
      }[];
    };
  }[];
  linksTo?: {
    id: string;
    linkType: string;
    createdAt: string;
    source: {
      id: string;
      title: string | null;
      body: string | null;
      createdAt: string;
      typeAssignments?: {
        memoryType: MemoryType;
      }[];
    };
  }[];
  state: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryType {
  id: string;
  code: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  enabled: boolean;
  storageStrategy: 'generic' | 'structured';
  sortOrder: number;
}

export interface CreateMemoryDto {
  textContent?: string;
  imageUrl?: string;
  typeId?: string;
}

export async function createMemory(draft: {
  text?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  typeId?: string;
  locationId?: string;
  personId?: string;
  youtubeVideoId?: string;
  tiktokVideoId?: string;
  idempotencyKey: string
}): Promise<Memory> {
  const response = await fetchWithAuth('/memories', {
    method: 'POST',
    headers: {
      'Idempotency-Key': draft.idempotencyKey,
    },
    body: JSON.stringify({
      textContent: draft.text,
      imageUrl: draft.imageUrl,
      latitude: draft.latitude,
      longitude: draft.longitude,
      typeId: draft.typeId,
      locationId: draft.locationId,
      personId: draft.personId,
      youtubeVideoId: draft.youtubeVideoId,
      tiktokVideoId: draft.tiktokVideoId,
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

export async function getMemoryTypes(): Promise<MemoryType[]> {
  const response = await fetchWithAuth('/memories/types');
  return response.json();
}

export async function getMemory(id: string): Promise<Memory> {
  const response = await fetchWithAuth(`/memories/${id}`);
  return response.json();
}

export async function updateMemory(id: string, data: {
  textContent?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  typeId?: string;
  wordId?: string | null;
  eventId?: string | null;
  locationId?: string | null;
  personId?: string | null;
  youtubeVideoId?: string | null;
  tiktokVideoId?: string | null;
}): Promise<Memory> {
  const response = await fetchWithAuth(`/memories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteMemory(id: string): Promise<void> {
  await fetchWithAuth(`/memories/${id}`, {
    method: 'DELETE',
  });
}

// Text Analysis Types
export interface PersonMatch {
  extractedName: string;
  existingMatches: Array<{
    id: string;
    displayName: string;
    email: string | null;
  }>;
  isNewPerson: boolean;
}

export interface LocationMatch {
  extractedName: string;
  existingMatches: Array<{
    id: string;
    name: string;
    city: string | null;
    address: string | null;
  }>;
  isNewLocation: boolean;
}

export interface SpellingError {
  word: string;
  isCorrect: boolean;
  suggestions: string[];
  position: { start: number; end: number };
}

export interface YouTubeVideoMatch {
  url: string;
  videoId: string;
  existingVideo: {
    id: string;
    title: string;
    creatorDisplayName: string;
    thumbnailUrl: string | null;
  } | null;
  isNewVideo: boolean;
}

export interface WordMatch {
  word: string;
  existingWord: {
    id: string;
    word: string;
    description: string | null;
    partOfSpeech: string | null;
    memoryCount: number;
  } | null;
  isNewWord: boolean;
}

export interface TextAnalysisResult {
  persons: PersonMatch[];
  locations: LocationMatch[];
  youtubeVideos: YouTubeVideoMatch[];
  words: WordMatch[];
  spellingErrors: SpellingError[];
  extractionSummary: any[];
}

export async function analyzeText(text: string): Promise<TextAnalysisResult> {
  const response = await fetchWithAuth('/memories/analyze', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return response.json();
}

export async function linkWordsToMemory(memoryId: string, words: string[]): Promise<{ linked: string[], created: string[] }> {
  const response = await fetchWithAuth(`/memories/${memoryId}/link-words`, {
    method: 'POST',
    body: JSON.stringify({ words }),
  });
  return response.json();
}

