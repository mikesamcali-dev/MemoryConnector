const API_BASE = '/api/v1';

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('accessToken');
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

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

export interface Image {
  id: string;
  userId: string;
  storageUrl: string;
  storageKey: string;
  thumbnailUrl256?: string;
  thumbnailUrl1024?: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  phash?: string;
  width?: number;
  height?: number;
  exifData?: any;
  capturedAt?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  locationSource?: string;
  consentBiometrics: boolean;
  createdAt: string;
  updatedAt: string;
  isDuplicate?: boolean;
  message?: string;
  memoryLinks?: {
    id: string;
    memoryId: string;
    imageId: string;
    createdAt: string;
    memory: {
      id: string;
      textContent: string;
      createdAt: string;
    };
  }[];
  faces?: {
    id: string;
    imageId: string;
    bboxX: number;
    bboxY: number;
    bboxWidth: number;
    bboxHeight: number;
    blurScore?: number;
    occlusionScore?: number;
    poseYaw?: number;
    posePitch?: number;
    poseRoll?: number;
    embedding?: any;
    embeddingModel?: string;
    faceCropUrl?: string;
    createdAt: string;
  }[];
  personLinks?: {
    id: string;
    imageId: string;
    personId: string;
    faceId?: string;
    confidence?: number;
    linkMethod: string;
    createdAt: string;
    person: {
      id: string;
      displayName: string;
      email?: string;
    };
  }[];
}

export interface UploadImageDto {
  imageData: string; // Base64-encoded image
  contentType: string;
  filename?: string;
  consentBiometrics?: boolean;
  capturedAt?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  locationSource?: string;
}

export async function uploadImage(uploadDto: UploadImageDto): Promise<Image> {
  const response = await fetchWithAuth('/images/upload', {
    method: 'POST',
    body: JSON.stringify(uploadDto),
  });
  return response.json();
}

export async function getUserImages(skip = 0, take = 20): Promise<Image[]> {
  const response = await fetchWithAuth(`/images?skip=${skip}&take=${take}`);
  return response.json();
}

export async function getImage(id: string): Promise<Image> {
  const response = await fetchWithAuth(`/images/${id}`);
  return response.json();
}

export async function linkImageToMemory(imageId: string, memoryId: string): Promise<any> {
  const response = await fetchWithAuth('/images/link', {
    method: 'POST',
    body: JSON.stringify({ imageId, memoryId }),
  });
  return response.json();
}

export async function linkImagesToMemory(memoryId: string, imageIds: string[]): Promise<any> {
  const response = await fetchWithAuth('/images/link-multiple', {
    method: 'POST',
    body: JSON.stringify({ memoryId, imageIds }),
  });
  return response.json();
}

export async function deleteImage(id: string): Promise<void> {
  await fetchWithAuth(`/images/${id}`, {
    method: 'DELETE',
  });
}
