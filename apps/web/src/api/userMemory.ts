import { fetchWithAuth } from './client';

// Create apiClient wrapper for backward compatibility
const apiClient = {
  get: async (url: string) => {
    const response = await fetchWithAuth(url);
    return { data: await response.json() };
  },
  put: async (url: string, data: any) => {
    const response = await fetchWithAuth(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return { data: await response.json() };
  }
};

export interface UserMemoryProfile {
  id: string;
  userId: string;
  learningStyle: 'VISUAL' | 'HANDS_ON' | 'THEORETICAL' | 'MIXED';
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  primaryGoal: 'RETENTION' | 'LEARNING' | 'ORGANIZATION' | 'HABIT_BUILDING';
  preferredPace: 'INTENSIVE' | 'MODERATE' | 'GRADUAL';
  dailyTimeCommitment: number;
  areasOfInterest: string[];
  preferredReviewTime: string | null;
  onboardingCompleted: boolean;
  averageRecallRate: number;
  averageReviewTime: number;
  optimalReviewInterval: number;
  lastAdaptationUpdate: string;
  peakActivityHours: number[];
  consecutiveMissedDays: number;
  totalCheckIns: number;
  lastCheckInDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileDto {
  learningStyle?: 'VISUAL' | 'HANDS_ON' | 'THEORETICAL' | 'MIXED';
  skillLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  primaryGoal?: 'RETENTION' | 'LEARNING' | 'ORGANIZATION' | 'HABIT_BUILDING';
  preferredPace?: 'INTENSIVE' | 'MODERATE' | 'GRADUAL';
  dailyTimeCommitment?: number;
  areasOfInterest?: string[];
  preferredReviewTime?: string | null;
}

export async function getUserMemoryProfile(): Promise<UserMemoryProfile | null> {
  try {
    const response = await apiClient.get('/user-memory/profile');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function updateUserMemoryProfile(data: UpdateProfileDto): Promise<UserMemoryProfile> {
  const response = await apiClient.put('/user-memory/profile', data);
  return response.data;
}
