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

export interface SystemStats {
  users: number;
  memories: number;
  memoriesToday: number;
  embeddings: number;
  timestamp: string;
}

export interface AICostTracking {
  dailySpend: {
    totalCents: number;
    percentUsed: number;
    operationCount: number;
    circuitState: 'CLOSED' | 'OPEN' | 'QUEUE_ONLY';
  };
  todayCostsByOperation: {
    operation: string;
    count: number;
    totalTokens: number;
    totalCents: number;
  }[];
  recentOperations: {
    id: string;
    userId: string;
    operation: string;
    tokensUsed: number;
    costCents: number;
    model: string;
    memoryId: string | null;
    date: string;
  }[];
}

export interface CircuitBreakerStatus {
  state: 'CLOSED' | 'OPEN' | 'QUEUE_ONLY';
  dailySpendCents: number;
  percentUsed: number;
  operationCount: number;
  timestamp: string;
}

export interface EnrichmentWorkerStatus {
  worker: {
    isActive: boolean;
    lastProcessedAt: string | null;
  };
  queue: {
    pending: number;
    processing: number;
    completedToday: number;
    failedToday: number;
  };
  timestamp: string;
}

export interface MemoryType {
  id: string;
  code: string;
  label: string;
  description?: string;
  icon: string;
  color: string;
  storageStrategy: 'generic' | 'structured';
  tableName?: string;
  enabled: boolean;
  sortOrder: number;
  usageCount?: number;
}

export interface Word {
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
  usageCount?: number;
  lastEnrichedAt: string | null;
  createdAt: string;
  updatedAt: string;
  memories?: {
    id: string;
    userId: string;
    textContent: string;
    createdAt: string;
    user: {
      id: string;
      email: string;
    };
  }[];
}

export interface Event {
  id: string;
  name: string;
  description: string | null;
  eventDate: string | null;
  location: string | null;
  imageUrl: string | null;
  tags: string[] | null;
  usageCount?: number;
  lastEnrichedAt: string | null;
  createdAt: string;
  updatedAt: string;
  memories?: {
    id: string;
    userId: string;
    textContent: string;
    createdAt: string;
    user: {
      id: string;
      email: string;
    };
  }[];
}

export interface Location {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  locationType: string | null;
  placeType: string | null;
  imageUrl: string | null;
  usageCount?: number;
  lastEnrichedAt: string | null;
  createdAt: string;
  updatedAt: string;
  memories?: {
    id: string;
    userId: string;
    textContent: string;
    createdAt: string;
    user: {
      id: string;
      email: string;
    };
  }[];
}

export interface Person {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  lastEnrichedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    memories: number;
  };
  memories?: {
    id: string;
    userId: string;
    textContent: string;
    createdAt: string;
    user: {
      id: string;
      email: string;
    };
  }[];
}

// System Stats
export async function getSystemStats(): Promise<SystemStats> {
  const response = await fetchWithAuth('/admin/stats');
  return response.json();
}

export async function getAllUsers(): Promise<any[]> {
  console.log('Calling GET /admin/users');
  const response = await fetchWithAuth('/admin/users');
  const data = await response.json();
  console.log('GET /admin/users response:', data);
  return data;
}

export async function getAllMemoriesByUser(): Promise<any[]> {
  const response = await fetchWithAuth('/admin/memories-by-user');
  return response.json();
}

export async function getFailedJobs(): Promise<any[]> {
  const response = await fetchWithAuth('/admin/failed-jobs');
  return response.json();
}

// AI Cost Tracking
export async function getAICostTracking(): Promise<AICostTracking> {
  const response = await fetchWithAuth('/admin/ai-cost-tracking');
  return response.json();
}

// Circuit Breaker
export async function getCircuitBreakerStatus(): Promise<CircuitBreakerStatus> {
  const response = await fetchWithAuth('/admin/circuit-breaker');
  return response.json();
}

// Enrichment Worker
export async function getEnrichmentWorkerStatus(): Promise<EnrichmentWorkerStatus> {
  const response = await fetchWithAuth('/admin/enrichment-worker');
  return response.json();
}

export async function triggerEnrichment() {
  const response = await fetchWithAuth('/admin/enrichment-worker/trigger', {
    method: 'POST',
  });
  return response.json();
}

// Memory Types
export async function getMemoryTypes(): Promise<MemoryType[]> {
  const response = await fetchWithAuth('/admin/memory-types');
  return response.json();
}

export async function createMemoryType(data: {
  code: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  storageStrategy?: 'generic' | 'structured';
  tableName?: string;
  enabled?: boolean;
  sortOrder?: number;
}) {
  const response = await fetchWithAuth('/admin/memory-types', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateMemoryType(
  id: string,
  data: {
    code?: string;
    label?: string;
    description?: string;
    icon?: string;
    color?: string;
    storageStrategy?: 'generic' | 'structured';
    tableName?: string;
    enabled?: boolean;
    sortOrder?: number;
  }
) {
  const response = await fetchWithAuth(`/admin/memory-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteMemoryType(id: string) {
  const response = await fetchWithAuth(`/admin/memory-types/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}

// Words
export async function getAllWords(): Promise<Word[]> {
  const response = await fetchWithAuth('/admin/words');
  return response.json();
}

export async function getWord(id: string): Promise<Word> {
  const response = await fetchWithAuth(`/admin/words/${id}`);
  return response.json();
}

export async function enrichWord(id: string): Promise<Word> {
  const response = await fetchWithAuth(`/admin/words/${id}/enrich`, {
    method: 'POST',
  });
  return response.json();
}

export async function deleteWord(id: string): Promise<void> {
  await fetchWithAuth(`/admin/words/${id}`, {
    method: 'DELETE',
  });
}

export async function lookupWord(wordText: string): Promise<Word[]> {
  try {
    const response = await fetchWithAuth(`/words/lookup/${encodeURIComponent(wordText)}`);
    const text = await response.text();

    // Handle empty response
    if (!text || text.trim() === '') {
      return [];
    }

    // Parse JSON
    return JSON.parse(text);
  } catch (error) {
    // If word doesn't exist or any error occurs, return empty array
    console.warn(`Failed to lookup word "${wordText}":`, error);
    return [];
  }
}

export async function deduplicateWords(): Promise<{ removed: number; kept: number }> {
  const response = await fetchWithAuth('/admin/words/deduplicate', {
    method: 'POST',
  });
  return response.json();
}

// Events
export async function getAllEvents(): Promise<Event[]> {
  const response = await fetchWithAuth('/admin/events');
  return response.json();
}

export async function getEvent(id: string): Promise<Event> {
  const response = await fetchWithAuth(`/admin/events/${id}`);
  return response.json();
}

export async function createEvent(name: string): Promise<Event> {
  const response = await fetchWithAuth('/events', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return response.json();
}

export async function enrichEvent(id: string): Promise<Event> {
  const response = await fetchWithAuth(`/admin/events/${id}/enrich`, {
    method: 'POST',
  });
  return response.json();
}

// Locations
export async function getAllLocations(): Promise<Location[]> {
  const response = await fetchWithAuth('/admin/locations');
  return response.json();
}

export async function getAllLocationsForUser(): Promise<Location[]> {
  const response = await fetchWithAuth('/locations');
  return response.json();
}

export async function getLocation(id: string): Promise<Location> {
  const response = await fetchWithAuth(`/admin/locations/${id}`);
  return response.json();
}

export async function createLocation(
  name: string,
  latitude?: number,
  longitude?: number,
  address?: string,
  city?: string,
  state?: string,
  zip?: string,
  country?: string,
  locationType?: string,
  placeType?: string,
): Promise<Location> {
  const response = await fetchWithAuth('/locations', {
    method: 'POST',
    body: JSON.stringify({ name, latitude, longitude, address, city, state, zip, country, locationType, placeType }),
  });
  return response.json();
}

export async function findNearbyLocations(
  latitude: number,
  longitude: number
): Promise<Location[]> {
  const response = await fetchWithAuth(
    `/locations/nearby?latitude=${latitude}&longitude=${longitude}`
  );
  return response.json();
}

export async function getRecentLocations(limit: number = 10): Promise<Location[]> {
  const response = await fetchWithAuth(`/locations/recent?limit=${limit}`);
  return response.json();
}

export async function enrichLocation(id: string): Promise<Location> {
  const response = await fetchWithAuth(`/admin/locations/${id}/enrich`, {
    method: 'POST',
  });
  return response.json();
}

export async function previewLocationEnrichment(address: string): Promise<{
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  placeType: string | null;
}> {
  const response = await fetchWithAuth('/admin/locations/preview-enrich', {
    method: 'POST',
    body: JSON.stringify({ address }),
  });
  return response.json();
}

export async function updateLocation(
  id: string,
  data: {
    name?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    locationType?: string;
    placeType?: string;
  }
): Promise<Location> {
  const response = await fetchWithAuth(`/locations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteLocation(id: string): Promise<void> {
  const response = await fetchWithAuth(`/locations/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function getLocationMemories(id: string): Promise<any[]> {
  const response = await fetchWithAuth(`/locations/${id}/memories`);
  return response.json();
}

export async function discoverNearbyBusinesses(
  latitude: number,
  longitude: number,
  radiusMeters: number = 1000
): Promise<{ new: Location[]; existing: Location[] }> {
  const response = await fetchWithAuth('/locations/discover-nearby', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude, radiusMeters }),
  });
  return response.json();
}

export async function batchCreateLocations(
  locations: Array<{
    name: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    placeType?: string;
  }>
): Promise<Location[]> {
  const response = await fetchWithAuth('/locations/batch-create', {
    method: 'POST',
    body: JSON.stringify({ locations }),
  });
  return response.json();
}

// People
export async function getAllPeople(): Promise<Person[]> {
  const response = await fetchWithAuth('/people');
  return response.json();
}

export async function getPerson(id: string): Promise<Person> {
  const response = await fetchWithAuth(`/people/${id}`);
  return response.json();
}

export async function createPerson(
  displayName: string,
  email?: string,
  phone?: string,
  bio?: string
): Promise<Person> {
  const response = await fetchWithAuth('/people', {
    method: 'POST',
    body: JSON.stringify({ displayName, email, phone, bio }),
  });
  return response.json();
}

export async function updatePerson(
  id: string,
  data: {
    displayName?: string;
    email?: string;
    phone?: string;
    bio?: string;
  }
): Promise<Person> {
  const response = await fetchWithAuth(`/people/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deletePerson(id: string): Promise<void> {
  const response = await fetchWithAuth(`/people/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function searchPeople(query: string): Promise<Person[]> {
  const response = await fetchWithAuth(`/people/search?q=${encodeURIComponent(query)}`);
  return response.json();
}

export async function createPersonRelationship(
  sourcePersonId: string,
  targetPersonId: string,
  relationshipType: string
): Promise<any> {
  const response = await fetchWithAuth('/people/relationships', {
    method: 'POST',
    body: JSON.stringify({ sourcePersonId, targetPersonId, relationshipType }),
  });
  return response.json();
}

export async function getPersonRelationships(personId: string): Promise<any[]> {
  const response = await fetchWithAuth(`/people/${personId}/relationships`);
  return response.json();
}

export async function deletePersonRelationship(relationshipId: string): Promise<void> {
  const response = await fetchWithAuth(`/people/relationships/${relationshipId}`, {
    method: 'DELETE',
  });
  return response.json();
}

export interface PersonRelationshipGraph {
  people: Person[];
  relationships: {
    id: string;
    sourcePersonId: string;
    targetPersonId: string;
    relationshipType: string;
    sourcePerson: { id: string; displayName: string };
    targetPerson: { id: string; displayName: string };
    createdAt: string;
    updatedAt: string;
  }[];
}

export async function getAllRelationshipsGraph(): Promise<PersonRelationshipGraph> {
  const response = await fetchWithAuth('/people/relationships/all');
  return response.json();
}

// YouTube Videos
export interface YouTubeVideo {
  id: string;
  platform: string;
  youtubeVideoId: string;
  canonicalUrl: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  creatorDisplayName: string;
  channelId: string | null;
  publishedAt: string;
  durationSeconds: number;
  languageCode: string;
  transcriptStatus: 'none' | 'partial' | 'full' | 'failed';
  transcriptSource: 'captions' | 'auto' | 'asr' | 'manual' | 'unknown';
  transcriptText: string | null;
  transcriptSegments: any | null;
  summary: string | null;
  topics: any | null;
  chapters: any | null;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  favoriteCount: number | null;
  license: string | null;
  madeForKids: boolean | null;
  captionAvailable: boolean | null;
  capturedAt: string | null;
  categoryId: string | null;
  tags: any | null;
  externalLinks: any | null;
  contentHash: string | null;
  ingestionStatus: 'queued' | 'ingested' | 'retry' | 'failed' | 'blocked';
  ingestionAttempts: number;
  lastIngestionError: string | null;
  ingestedAt: string | null;
  lastEnrichedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    memories: number;
  };
}

export async function getAllYouTubeVideos(skip: number = 0, take: number = 50): Promise<YouTubeVideo[]> {
  const response = await fetchWithAuth(`/youtube-videos?skip=${skip}&take=${take}`);
  return response.json();
}

export async function getYouTubeVideo(id: string): Promise<YouTubeVideo> {
  const response = await fetchWithAuth(`/youtube-videos/${id}`);
  return response.json();
}

export async function getYouTubeVideoByUrl(url: string): Promise<YouTubeVideo | null> {
  const response = await fetchWithAuth(`/youtube-videos/by-url?url=${encodeURIComponent(url)}`);
  return response.json();
}

export async function getYouTubeVideoByYouTubeId(youtubeVideoId: string): Promise<YouTubeVideo | null> {
  const response = await fetchWithAuth(`/youtube-videos/by-youtube-id/${youtubeVideoId}`);
  return response.json();
}

export async function searchYouTubeVideos(query: string, skip: number = 0, take: number = 20): Promise<YouTubeVideo[]> {
  const response = await fetchWithAuth(`/youtube-videos/search?q=${encodeURIComponent(query)}&skip=${skip}&take=${take}`);
  return response.json();
}

export async function createYouTubeVideo(data: {
  youtubeVideoId: string;
  canonicalUrl: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  creatorDisplayName: string;
  channelId?: string;
  publishedAt: string;
  durationSeconds: number;
  languageCode: string;
  transcriptStatus: 'none' | 'partial' | 'full' | 'failed';
  transcriptSource: 'captions' | 'auto' | 'asr' | 'manual' | 'unknown';
  transcriptText?: string;
  transcriptSegments?: any;
  summary?: string;
  topics?: any;
  chapters?: any;
  viewCount?: number;
  likeCount?: number;
  categoryId?: string;
  tags?: any;
  externalLinks?: any;
  contentHash?: string;
  ingestionStatus?: 'queued' | 'ingested' | 'retry' | 'failed' | 'blocked';
}): Promise<YouTubeVideo> {
  const response = await fetchWithAuth('/youtube-videos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateYouTubeVideo(
  id: string,
  data: {
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    creatorDisplayName?: string;
    channelId?: string;
    durationSeconds?: number;
    languageCode?: string;
    transcriptStatus?: 'none' | 'partial' | 'full' | 'failed';
    transcriptSource?: 'captions' | 'auto' | 'asr' | 'manual' | 'unknown';
    transcriptText?: string;
    transcriptSegments?: any;
    summary?: string;
    topics?: any;
    chapters?: any;
    viewCount?: number;
    likeCount?: number;
    categoryId?: string;
    tags?: any;
    externalLinks?: any;
    contentHash?: string;
    ingestionStatus?: 'queued' | 'ingested' | 'retry' | 'failed' | 'blocked';
    lastIngestionError?: string;
  }
): Promise<YouTubeVideo> {
  const response = await fetchWithAuth(`/youtube-videos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteYouTubeVideo(id: string): Promise<void> {
  await fetchWithAuth(`/youtube-videos/${id}`, {
    method: 'DELETE',
  });
}

export async function enrichYouTubeVideo(id: string): Promise<{
  message: string;
  videoId: string;
  status: string;
}> {
  const response = await fetchWithAuth(`/youtube-videos/${id}/enrich`, {
    method: 'POST',
  });
  return response.json();
}

export async function getYouTubeVideoMemories(id: string): Promise<any[]> {
  const response = await fetchWithAuth(`/youtube-videos/${id}/memories`);
  return response.json();
}

export async function extractYouTubeVideoId(url: string): Promise<{
  url: string;
  videoId: string | null;
  canonicalUrl: string | null;
}> {
  const response = await fetchWithAuth('/youtube-videos/extract-video-id', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  return response.json();
}

export async function createYouTubeVideoFromUrl(url: string): Promise<YouTubeVideo> {
  const response = await fetchWithAuth('/youtube-videos/from-url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  return response.json();
}

// LLM Extraction Data
export interface ExtractionData {
  id: string;
  userEmail: string;
  title: string | null;
  body: string | null;
  enrichmentStatus: string;
  createdAt: string;
  hasExtraction: boolean;
  extractionData: any;
  linkedPerson: {
    id: string;
    displayName: string;
    email: string | null;
  } | null;
  linkedLocation: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
  } | null;
  linkedEvent: {
    startAt: string | null;
    endAt: string | null;
    description: string | null;
  } | null;
  extractionSummary: {
    personCount: number;
    eventCount: number;
    locationCount: number;
    followUpCount: number;
  } | null;
}

export async function getExtractionData(): Promise<ExtractionData[]> {
  const response = await fetchWithAuth('/admin/extraction-data');
  return response.json();
}

// Enrichment Failures
export interface EnrichmentFailure {
  id: string;
  userId: string;
  userEmail: string;
  title: string | null;
  body: string | null;
  fullBody: string | null;
  enrichmentStatus: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  enrichmentQueuedAt: string | null;
  timeSinceCreation: number;
  timeSinceUpdate: number;
  logs: {
    created: string;
    updated: string;
    queued: string;
    status: string;
    diagnosis: string;
  };
}

export interface RetryResult {
  success: boolean;
  memoryId: string;
  title: string | null;
  queued: boolean;
  reason?: string;
  message: string;
  timestamp: string;
}

export interface RetryAllResult {
  success: boolean;
  summary: string;
  total: number;
  queued: number;
  failed: number;
  details: Array<{
    memoryId: string;
    title: string | null;
    queued: boolean;
    reason?: string;
    error?: string;
  }>;
  timestamp: string;
}

export async function getEnrichmentFailures(): Promise<EnrichmentFailure[]> {
  const response = await fetchWithAuth('/admin/enrichment-failures');
  return response.json();
}

export async function retryEnrichment(memoryId: string): Promise<RetryResult> {
  const response = await fetchWithAuth(`/admin/enrichment-failures/${memoryId}/retry`, {
    method: 'POST',
  });
  return response.json();
}

export async function retryAllFailedEnrichments(): Promise<RetryAllResult> {
  const response = await fetchWithAuth('/admin/enrichment-failures/retry-all', {
    method: 'POST',
  });
  return response.json();
}
