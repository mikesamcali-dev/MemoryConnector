import { fetchWithAuth } from './client';

export interface CreateSamMemoryDto {
  title: string;
  content: string;
  tags: string[];
  reliability: 'unverified' | 'inferred' | 'confirmed' | 'contested';
  confidence_score: number;
  context_window: {
    applies_to: string[];
    excludes: string[];
  };
  decay_policy: {
    type: 'exponential' | 'none';
    half_life_days: number;
    min_confidence: number;
  };
  training_examples?: Array<{
    user: string;
    assistant: string;
    assertions: string[];
  }>;
}

export interface SamMemory {
  id: string;
  userId: string;
  title: string;
  content: string;
  summary: string;
  canonicalPhrases: string[];
  tags: string[];
  sourceType: string;
  sourceRef: string;
  sourceUri: string | null;
  confidenceScore: number;
  reliability: string;
  usageCount: number;
  archiveFlag: boolean;
  embeddingModel: string;
  embeddingDims: number;
  embeddingRef: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export async function createSamMemory(dto: CreateSamMemoryDto): Promise<SamMemory> {
  const response = await fetchWithAuth('/sam', {
    method: 'POST',
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create SAM memory');
  }

  return response.json();
}

export async function getSamMemories(filters?: {
  archived?: boolean;
  tags?: string[];
  search?: string;
}): Promise<SamMemory[]> {
  const params = new URLSearchParams();

  if (filters?.archived !== undefined) {
    params.append('archived', String(filters.archived));
  }
  if (filters?.tags) {
    params.append('tags', filters.tags.join(','));
  }
  if (filters?.search) {
    params.append('search', filters.search);
  }

  const response = await fetchWithAuth(`/sam?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch SAM memories');
  }

  return response.json();
}

export async function getSamMemory(id: string): Promise<SamMemory> {
  const response = await fetchWithAuth(`/sam/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch SAM memory');
  }

  return response.json();
}

export async function updateSamMemory(
  id: string,
  dto: Partial<CreateSamMemoryDto>
): Promise<SamMemory> {
  const response = await fetchWithAuth(`/sam/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error('Failed to update SAM memory');
  }

  return response.json();
}

export async function archiveSamMemory(id: string): Promise<SamMemory> {
  const response = await fetchWithAuth(`/sam/${id}/archive`, {
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error('Failed to archive SAM memory');
  }

  return response.json();
}

export async function deleteSamMemory(id: string): Promise<void> {
  const response = await fetchWithAuth(`/sam/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete SAM memory');
  }
}
