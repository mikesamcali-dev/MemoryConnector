import { fetchWithAuth } from './client';

// TypeScript interfaces
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
    memoryLinks: number;
    imageLinks: number;
    urlPageLinks: number;
    youtubeVideoLinks: number;
    tiktokVideoLinks: number;
    relationshipsFrom: number;
    relationshipsTo: number;
  };
}

export interface PersonWithLinks extends Person {
  memories: Array<{
    id: string;
    body: string | null;
    createdAt: string;
    user: {
      id: string;
      email: string;
    };
  }>;
  memoryLinks: Array<{
    id: string;
    memory: {
      id: string;
      body: string | null;
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
      imageUrl: string | null;
      siteName: string | null;
      author: string | null;
      publishedAt: string | null;
      createdAt: string;
    };
    createdAt: string;
  }>;
  youtubeVideoLinks: Array<{
    id: string;
    youtubeVideo: {
      id: string;
      youtubeVideoId: string;
      title: string;
      description: string | null;
      thumbnailUrl: string | null;
      creatorDisplayName: string;
      publishedAt: string | null;
      durationSeconds: number | null;
      viewCount: number | null;
      likeCount: number | null;
      createdAt: string;
    };
    createdAt: string;
  }>;
  tiktokVideoLinks: Array<{
    id: string;
    tiktokVideo: {
      id: string;
      tiktokVideoId: string;
      title: string;
      description: string | null;
      thumbnailUrl: string | null;
      creatorDisplayName: string;
      creatorUsername: string | null;
      publishedAt: string | null;
      durationSeconds: number | null;
      viewCount: number | null;
      likeCount: number | null;
      createdAt: string;
    };
    createdAt: string;
  }>;
}

export interface CreatePersonData {
  displayName: string;
  email?: string;
  phone?: string;
  bio?: string;
}

export interface UpdatePersonData {
  displayName?: string;
  email?: string;
  phone?: string;
  bio?: string;
}

// API functions
export async function getAllPeople(): Promise<Person[]> {
  const response = await fetchWithAuth('/people');
  return response.json();
}

export async function getPersonById(id: string): Promise<PersonWithLinks> {
  const response = await fetchWithAuth(`/people/${id}`);
  return response.json();
}

export async function searchPeople(query: string): Promise<Person[]> {
  const response = await fetchWithAuth(`/people/search?q=${encodeURIComponent(query)}`);
  return response.json();
}

export async function createPerson(data: CreatePersonData): Promise<Person> {
  const response = await fetchWithAuth('/people', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updatePerson(
  id: string,
  data: UpdatePersonData,
): Promise<Person> {
  const response = await fetchWithAuth(`/people/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deletePerson(id: string): Promise<void> {
  await fetchWithAuth(`/people/${id}`, {
    method: 'DELETE',
  });
}

// Linking functions
export async function linkMemoryToPerson(
  personId: string,
  memoryId: string,
): Promise<void> {
  await fetchWithAuth(`/people/${personId}/memories/${memoryId}`, {
    method: 'POST',
  });
}

export async function unlinkMemoryFromPerson(
  personId: string,
  memoryId: string,
): Promise<void> {
  await fetchWithAuth(`/people/${personId}/memories/${memoryId}`, {
    method: 'DELETE',
  });
}

export async function linkImageToPerson(
  personId: string,
  imageId: string,
): Promise<void> {
  await fetchWithAuth(`/people/${personId}/images/${imageId}`, {
    method: 'POST',
  });
}

export async function unlinkImageFromPerson(
  personId: string,
  imageId: string,
): Promise<void> {
  await fetchWithAuth(`/people/${personId}/images/${imageId}`, {
    method: 'DELETE',
  });
}

export async function linkUrlPageToPerson(
  personId: string,
  urlPageId: string,
): Promise<void> {
  await fetchWithAuth(`/people/${personId}/url-pages/${urlPageId}`, {
    method: 'POST',
  });
}

export async function unlinkUrlPageFromPerson(
  personId: string,
  urlPageId: string,
): Promise<void> {
  await fetchWithAuth(`/people/${personId}/url-pages/${urlPageId}`, {
    method: 'DELETE',
  });
}

export async function linkYouTubeVideoToPerson(
  personId: string,
  youtubeVideoId: string,
): Promise<void> {
  await fetchWithAuth(`/people/${personId}/youtube-videos/${youtubeVideoId}`, {
    method: 'POST',
  });
}

export async function unlinkYouTubeVideoFromPerson(
  personId: string,
  youtubeVideoId: string,
): Promise<void> {
  await fetchWithAuth(`/people/${personId}/youtube-videos/${youtubeVideoId}`, {
    method: 'DELETE',
  });
}

export async function linkTikTokVideoToPerson(
  personId: string,
  tiktokVideoId: string,
): Promise<void> {
  await fetchWithAuth(`/people/${personId}/tiktok-videos/${tiktokVideoId}`, {
    method: 'POST',
  });
}

export async function unlinkTikTokVideoFromPerson(
  personId: string,
  tiktokVideoId: string,
): Promise<void> {
  await fetchWithAuth(`/people/${personId}/tiktok-videos/${tiktokVideoId}`, {
    method: 'DELETE',
  });
}

// Relationship functions (for person-to-person relationships)
export async function createPersonRelationship(
  sourcePersonId: string,
  targetPersonId: string,
  relationshipType: string,
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
  await fetchWithAuth(`/people/relationships/${relationshipId}`, {
    method: 'DELETE',
  });
}

export async function getAllRelationshipsWithPeople(): Promise<{
  people: Person[];
  relationships: any[];
}> {
  const response = await fetchWithAuth('/people/relationships/all');
  return response.json();
}
