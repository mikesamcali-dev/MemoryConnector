/**
 * Shared TypeScript types for Memory Connector
 * These types are used across web and mobile apps
 */

export interface Memory {
  id: string;
  textContent?: string;
  title?: string;
  body?: string;
  data?: any;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  typeId?: string;
  type?: MemoryType;
  state: string;
  createdAt: string;
  updatedAt: string;

  // SRS fields
  lastReviewedAt?: string | null;
  nextReviewAt?: string | null;
  reviewInterval?: number | null;
  easeFactor?: number | null;
  reviewCount?: number;
  lapseCount?: number;
}

export interface MemoryType {
  id: string;
  code: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  enabled: boolean;
  storageStrategy: 'generic' | 'structured';
  sortOrder: number;
}

export interface CreateMemoryDto {
  textContent?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  typeId?: string;
  locationId?: string;
  personId?: string;
  youtubeVideoId?: string;
  tiktokVideoId?: string;
}

export interface SearchResult {
  memories: Memory[];
  totalCount: number;
  degraded?: boolean;
}

export interface User {
  id: string;
  email: string;
  tier: 'free' | 'premium';
  roles: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'capture' | 'review' | 'streak' | 'network' | 'special';
  unlocked: boolean;
  progress: number;
  reward?: string;
}

export interface ReviewStats {
  totalReviewsCompleted: number;
  recallSuccessRate: number;
  currentStreakDays: number;
  longestStreakDays: number;
}

export enum ReviewRating {
  AGAIN = 'again',   // 1 day
  HARD = 'hard',     // 3 days
  GOOD = 'good',     // 6 days
  EASY = 'easy',     // 30 days
}
