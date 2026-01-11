import { fetchWithAuth } from './client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface TrainingDeck {
  id: string;
  userId: string;
  trainingId: string;
  title: string | null;
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
  training?: {
    id: string;
    name: string;
  };
}

export interface TrainingLesson {
  id: string;
  trainingDeckId: string;
  memoryId: string | null;
  imageId: string | null;
  urlPageId: string | null;
  youtubeVideoId: string | null;
  tiktokVideoId: string | null;
  sortOrder: number;
  createdAt: string;

  // Polymorphic content
  memory?: LessonMemory;
  image?: LessonImage;
  urlPage?: LessonUrlPage;
  youtubeVideo?: LessonYouTubeVideo;
  tiktokVideo?: LessonTikTokVideo;
}

export interface LessonMemory {
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

export interface LessonImage {
  id: string;
  storageUrl: string;
  thumbnailUrl256: string | null;
  thumbnailUrl1024: string | null;
  contentType: string;
  capturedAt: string | null;
  createdAt: string;
}

export interface LessonUrlPage {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  summary: string | null;
  faviconUrl: string | null;
  createdAt: string;
}

export interface LessonYouTubeVideo {
  id: string;
  videoId: string;
  title: string | null;
  thumbnailUrl: string | null;
  channelTitle: string | null;
  canonicalUrl: string;
  createdAt: string;
}

export interface LessonTikTokVideo {
  id: string;
  videoUrl: string;
  title: string | null;
  thumbnailUrl: string | null;
  creator: string | null;
  canonicalUrl: string;
  createdAt: string;
}

export interface CreateTrainingDeckData {
  trainingId: string;
  title?: string;
}

export interface UpdateTrainingDeckData {
  title?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get all training decks for the current user
 */
export async function getAllTrainingDecks(): Promise<TrainingDeck[]> {
  const response = await fetchWithAuth('/training-decks');
  if (!response.ok) {
    throw new Error('Failed to fetch training decks');
  }
  return response.json();
}

/**
 * Create a new training deck from a training
 */
export async function createTrainingDeck(
  data: CreateTrainingDeckData,
): Promise<TrainingDeck> {
  const response = await fetchWithAuth('/training-decks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create training deck');
  }

  return response.json();
}

/**
 * Get a specific training deck by ID
 */
export async function getTrainingDeck(trainingDeckId: string): Promise<TrainingDeck> {
  const response = await fetchWithAuth(`/training-decks/${trainingDeckId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch training deck');
  }
  return response.json();
}

/**
 * Get all lessons for a specific deck
 */
export async function getLessons(trainingDeckId: string): Promise<TrainingLesson[]> {
  const response = await fetchWithAuth(`/training-decks/${trainingDeckId}/lessons`);
  if (!response.ok) {
    throw new Error('Failed to fetch lessons');
  }
  return response.json();
}

/**
 * Update a training deck
 */
export async function updateTrainingDeck(
  trainingDeckId: string,
  data: UpdateTrainingDeckData,
): Promise<TrainingDeck> {
  const response = await fetchWithAuth(`/training-decks/${trainingDeckId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update training deck');
  }

  return response.json();
}

/**
 * Delete a training deck
 */
export async function deleteTrainingDeck(trainingDeckId: string): Promise<void> {
  const response = await fetchWithAuth(`/training-decks/${trainingDeckId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete training deck');
  }
}
