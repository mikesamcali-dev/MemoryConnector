import { fetchWithAuth } from './client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface SlideDeck {
  id: string;
  userId: string;
  title: string | null;
  slideCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Slide {
  id: string;
  slideDeckId: string;
  reminderId: string;
  memoryId: string;
  sortOrder: number;
  createdAt: string;
  memory: SlideMemory;
}

export interface SlideMemory {
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
 * Get all slide decks for the current user
 */
export async function getAllSlideDecks(): Promise<SlideDeck[]> {
  const response = await fetchWithAuth('/slidedecks');
  if (!response.ok) {
    throw new Error('Failed to fetch slide decks');
  }
  return response.json();
}

/**
 * Create a new slide deck from overdue reminders
 */
export async function createSlideDeckFromOverdue(
  title?: string,
): Promise<SlideDeck> {
  const response = await fetchWithAuth('/slidedecks/create-from-overdue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create slide deck');
  }

  return response.json();
}

/**
 * Get a specific slide deck by ID
 */
export async function getSlideDeck(slideDeckId: string): Promise<SlideDeck> {
  const response = await fetchWithAuth(`/slidedecks/${slideDeckId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch slide deck');
  }
  return response.json();
}

/**
 * Get all slides for a specific deck
 */
export async function getSlides(slideDeckId: string): Promise<Slide[]> {
  const response = await fetchWithAuth(`/slidedecks/${slideDeckId}/slides`);
  if (!response.ok) {
    throw new Error('Failed to fetch slides');
  }
  return response.json();
}

/**
 * Update a slide deck
 */
export async function updateSlideDeck(
  slideDeckId: string,
  data: { title?: string },
): Promise<SlideDeck> {
  const response = await fetchWithAuth(`/slidedecks/${slideDeckId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update slide deck');
  }

  return response.json();
}

/**
 * Delete a slide deck
 */
export async function deleteSlideDeck(slideDeckId: string): Promise<void> {
  const response = await fetchWithAuth(`/slidedecks/${slideDeckId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete slide deck');
  }
}

/**
 * Get all recent reminders for slidedeck selection
 */
export async function getRecentRemindersForSelection(): Promise<any[]> {
  const response = await fetchWithAuth('/slidedecks/recent-reminders');

  if (!response.ok) {
    throw new Error('Failed to fetch recent reminders');
  }

  return response.json();
}

/**
 * Create a new slide deck from selected reminder IDs
 */
export async function createSlideDeckFromSelected(
  reminderIds: string[],
  title?: string,
): Promise<SlideDeck> {
  const response = await fetchWithAuth('/slidedecks/create-from-selected', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reminderIds, title }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create slide deck');
  }

  return response.json();
}
