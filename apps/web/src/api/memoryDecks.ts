import { fetchWithAuth } from './client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface MemoryDeck {
  id: string;
  userId: string;
  title: string | null;
  isArchived: boolean;
  autoCreated: boolean;
  weekStartDate: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryDeckItem {
  id: string;
  memoryDeckId: string;
  memoryId: string;
  sortOrder: number;
  createdAt: string;
  memory: MemoryDeckItemMemory;
}

export interface MemoryDeckItemMemory {
  id: string;
  body: string | null;

  // Shared entity relations
  event: {
    id: string;
    name: string;
    description: string | null;
  } | null;

  location: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    country: string | null;
  } | null;

  person: {
    id: string;
    displayName: string;
  } | null;

  youtubeVideo: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    canonicalUrl: string;
  } | null;

  tiktokVideo: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    canonicalUrl: string;
  } | null;

  // Many-to-many relations
  wordLinks: Array<{
    id: string;
    word: {
      id: string;
      word: string;
      description: string | null;
    };
  }>;

  imageLinks: Array<{
    id: string;
    image: {
      id: string;
      storageUrl: string;
      thumbnailUrl256?: string;
      thumbnailUrl1024?: string;
    };
  }>;

  urlPageLinks: Array<{
    id: string;
    urlPage: {
      id: string;
      title: string | null;
      summary: string | null;
    };
  }>;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get all memory decks for the current user
 */
export async function getAllMemoryDecks(): Promise<MemoryDeck[]> {
  const response = await fetchWithAuth('/memory-decks');
  if (!response.ok) {
    throw new Error('Failed to fetch memory decks');
  }
  return response.json();
}

/**
 * Get current (non-archived) memory deck
 */
export async function getCurrentMemoryDeck(): Promise<MemoryDeck | null> {
  const response = await fetchWithAuth('/memory-decks/current');
  if (!response.ok) {
    throw new Error('Failed to fetch current memory deck');
  }
  return response.json();
}

/**
 * Get a specific memory deck by ID
 */
export async function getMemoryDeck(memoryDeckId: string): Promise<MemoryDeck> {
  const response = await fetchWithAuth(`/memory-decks/${memoryDeckId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch memory deck');
  }
  return response.json();
}

/**
 * Get all items for a specific deck
 */
export async function getMemoryDeckItems(memoryDeckId: string): Promise<MemoryDeckItem[]> {
  const response = await fetchWithAuth(`/memory-decks/${memoryDeckId}/items`);
  if (!response.ok) {
    throw new Error('Failed to fetch memory deck items');
  }
  return response.json();
}

/**
 * Update a memory deck
 */
export async function updateMemoryDeck(
  memoryDeckId: string,
  data: { title?: string },
): Promise<MemoryDeck> {
  const response = await fetchWithAuth(`/memory-decks/${memoryDeckId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update memory deck');
  }

  return response.json();
}

/**
 * Archive a memory deck
 */
export async function archiveMemoryDeck(memoryDeckId: string): Promise<void> {
  const response = await fetchWithAuth(`/memory-decks/${memoryDeckId}/archive`, {
    method: 'PATCH',
  });

  if (!response.ok) {
    throw new Error('Failed to archive memory deck');
  }
}

/**
 * Delete a memory deck
 */
export async function deleteMemoryDeck(memoryDeckId: string): Promise<void> {
  const response = await fetchWithAuth(`/memory-decks/${memoryDeckId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete memory deck');
  }
}
