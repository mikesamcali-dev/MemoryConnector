import { fetchWithAuth } from './client';

// TypeScript interfaces
export interface Project {
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

export interface ProjectWithMemories extends Project {
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

export interface CreateProjectData {
  name: string;
  description?: string;
  tags?: string[];
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  tags?: string[];
}

// API functions
export async function getAllProjects(): Promise<Project[]> {
  const response = await fetchWithAuth('/projects');
  return response.json();
}

export async function getProjectById(id: string): Promise<ProjectWithMemories> {
  const response = await fetchWithAuth(`/projects/${id}`);
  return response.json();
}

export async function createProject(data: CreateProjectData): Promise<Project> {
  const response = await fetchWithAuth('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateProject(
  id: string,
  data: UpdateProjectData,
): Promise<Project> {
  const response = await fetchWithAuth(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteProject(id: string): Promise<void> {
  await fetchWithAuth(`/projects/${id}`, {
    method: 'DELETE',
  });
}

export async function linkMemoryToProject(
  projectId: string,
  memoryId: string,
): Promise<void> {
  await fetchWithAuth(`/projects/${projectId}/memories/${memoryId}`, {
    method: 'POST',
  });
}

export async function unlinkMemoryFromProject(
  projectId: string,
  memoryId: string,
): Promise<void> {
  await fetchWithAuth(`/projects/${projectId}/memories/${memoryId}`, {
    method: 'DELETE',
  });
}

export async function linkImageToProject(
  projectId: string,
  imageId: string,
): Promise<void> {
  await fetchWithAuth(`/projects/${projectId}/images/${imageId}`, {
    method: 'POST',
  });
}

export async function unlinkImageFromProject(
  projectId: string,
  imageId: string,
): Promise<void> {
  await fetchWithAuth(`/projects/${projectId}/images/${imageId}`, {
    method: 'DELETE',
  });
}

export async function linkUrlPageToProject(
  projectId: string,
  urlPageId: string,
): Promise<void> {
  await fetchWithAuth(`/projects/${projectId}/url-pages/${urlPageId}`, {
    method: 'POST',
  });
}

export async function unlinkUrlPageFromProject(
  projectId: string,
  urlPageId: string,
): Promise<void> {
  await fetchWithAuth(`/projects/${projectId}/url-pages/${urlPageId}`, {
    method: 'DELETE',
  });
}

export async function linkYouTubeVideoToProject(
  projectId: string,
  youtubeVideoId: string,
): Promise<void> {
  await fetchWithAuth(`/projects/${projectId}/youtube-videos/${youtubeVideoId}`, {
    method: 'POST',
  });
}

export async function unlinkYouTubeVideoFromProject(
  projectId: string,
  youtubeVideoId: string,
): Promise<void> {
  await fetchWithAuth(`/projects/${projectId}/youtube-videos/${youtubeVideoId}`, {
    method: 'DELETE',
  });
}

export async function linkTikTokVideoToProject(
  projectId: string,
  tiktokVideoId: string,
): Promise<void> {
  await fetchWithAuth(`/projects/${projectId}/tiktok-videos/${tiktokVideoId}`, {
    method: 'POST',
  });
}

export async function unlinkTikTokVideoFromProject(
  projectId: string,
  tiktokVideoId: string,
): Promise<void> {
  await fetchWithAuth(`/projects/${projectId}/tiktok-videos/${tiktokVideoId}`, {
    method: 'DELETE',
  });
}
