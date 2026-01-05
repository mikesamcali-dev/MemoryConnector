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
