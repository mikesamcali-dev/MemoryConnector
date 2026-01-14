import { fetchWithAuth } from './client';

// TypeScript interfaces
export interface Training {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    memoryLinks: number;
    imageLinks: number;
    urlPageLinks: number;
    youtubeVideoLinks: number;
    tiktokVideoLinks: number;
  };
}

export interface TrainingWithContent extends Training {
  memoryLinks: Array<{
    id: string;
    memory: {
      id: string;
      body: string;
      createdAt: string;
    };
    createdAt: string;
  }>;
  imageLinks: Array<{
    id: string;
    image: {
      id: string;
      storageUrl: string;
      thumbnailUrl256: string | null;
      thumbnailUrl1024: string | null;
      contentType: string;
      capturedAt: string | null;
      createdAt: string;
    };
    createdAt: string;
  }>;
  urlPageLinks: Array<{
    id: string;
    urlPage: {
      id: string;
      url: string;
      title: string | null;
      description: string | null;
      faviconUrl: string | null;
      createdAt: string;
    };
    createdAt: string;
  }>;
  youtubeVideoLinks: Array<{
    id: string;
    youtubeVideo: {
      id: string;
      videoId: string;
      title: string | null;
      thumbnailUrl: string | null;
      channelTitle: string | null;
      createdAt: string;
    };
    createdAt: string;
  }>;
  tiktokVideoLinks: Array<{
    id: string;
    tiktokVideo: {
      id: string;
      videoUrl: string;
      title: string | null;
      thumbnailUrl: string | null;
      creator: string | null;
      createdAt: string;
    };
    createdAt: string;
  }>;
}

export interface CreateTrainingData {
  name: string;
  description?: string;
  tags?: string[];
}

export interface UpdateTrainingData {
  name?: string;
  description?: string;
  tags?: string[];
}

// API functions
export async function getAllTrainings(): Promise<Training[]> {
  const response = await fetchWithAuth('/trainings');
  return response.json();
}

export async function getTrainingById(id: string): Promise<TrainingWithContent> {
  const response = await fetchWithAuth(`/trainings/${id}`);
  return response.json();
}

export async function createTraining(data: CreateTrainingData): Promise<Training> {
  const response = await fetchWithAuth('/trainings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateTraining(
  id: string,
  data: UpdateTrainingData,
): Promise<Training> {
  const response = await fetchWithAuth(`/trainings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteTraining(id: string): Promise<void> {
  await fetchWithAuth(`/trainings/${id}`, {
    method: 'DELETE',
  });
}

export async function linkMemoryToTraining(
  trainingId: string,
  memoryId: string,
): Promise<void> {
  await fetchWithAuth(`/trainings/${trainingId}/memories/${memoryId}`, {
    method: 'POST',
  });
}

export async function unlinkMemoryFromTraining(
  trainingId: string,
  memoryId: string,
): Promise<void> {
  await fetchWithAuth(`/trainings/${trainingId}/memories/${memoryId}`, {
    method: 'DELETE',
  });
}

export async function linkImageToTraining(
  trainingId: string,
  imageId: string,
): Promise<void> {
  await fetchWithAuth(`/trainings/${trainingId}/images/${imageId}`, {
    method: 'POST',
  });
}

export async function unlinkImageFromTraining(
  trainingId: string,
  imageId: string,
): Promise<void> {
  await fetchWithAuth(`/trainings/${trainingId}/images/${imageId}`, {
    method: 'DELETE',
  });
}

export async function linkUrlPageToTraining(
  trainingId: string,
  urlPageId: string,
): Promise<void> {
  await fetchWithAuth(`/trainings/${trainingId}/url-pages/${urlPageId}`, {
    method: 'POST',
  });
}

export async function unlinkUrlPageFromTraining(
  trainingId: string,
  urlPageId: string,
): Promise<void> {
  await fetchWithAuth(`/trainings/${trainingId}/url-pages/${urlPageId}`, {
    method: 'DELETE',
  });
}

export async function linkYouTubeVideoToTraining(
  trainingId: string,
  youtubeVideoId: string,
): Promise<void> {
  await fetchWithAuth(`/trainings/${trainingId}/youtube-videos/${youtubeVideoId}`, {
    method: 'POST',
  });
}

export async function unlinkYouTubeVideoFromTraining(
  trainingId: string,
  youtubeVideoId: string,
): Promise<void> {
  await fetchWithAuth(`/trainings/${trainingId}/youtube-videos/${youtubeVideoId}`, {
    method: 'DELETE',
  });
}

export async function linkTikTokVideoToTraining(
  trainingId: string,
  tiktokVideoId: string,
): Promise<void> {
  await fetchWithAuth(`/trainings/${trainingId}/tiktok-videos/${tiktokVideoId}`, {
    method: 'POST',
  });
}

export async function unlinkTikTokVideoFromTraining(
  trainingId: string,
  tiktokVideoId: string,
): Promise<void> {
  await fetchWithAuth(`/trainings/${trainingId}/tiktok-videos/${tiktokVideoId}`, {
    method: 'DELETE',
  });
}

export async function updateLastViewedAt(trainingId: string): Promise<Training> {
  const response = await fetchWithAuth(`/trainings/${trainingId}/last-viewed`, {
    method: 'PATCH',
  });
  return response.json();
}

export async function createReminders(trainingId: string): Promise<any> {
  const response = await fetchWithAuth(`/trainings/${trainingId}/reminders`, {
    method: 'POST',
  });
  return response.json();
}
