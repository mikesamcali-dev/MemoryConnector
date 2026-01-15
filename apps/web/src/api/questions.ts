import { fetchWithAuth } from './client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface Question {
  id: string;
  userId: string;
  memoryId: string;
  question: string;
  answer: string | null;
  createdAt: string;
  updatedAt: string;
  memory?: {
    id: string;
    title: string | null;
    body: string | null;
    occurredAt: string | null;
  };
}

export interface CreateQuestionData {
  memoryId: string;
  question: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get all questions for the current user
 */
export async function getAllQuestions(): Promise<Question[]> {
  const response = await fetchWithAuth('/questions');
  if (!response.ok) {
    throw new Error('Failed to fetch questions');
  }
  return response.json();
}

/**
 * Get a specific question by ID
 */
export async function getQuestion(questionId: string): Promise<Question> {
  const response = await fetchWithAuth(`/questions/${questionId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch question');
  }
  return response.json();
}

/**
 * Create a question and get answer from OpenAI
 */
export async function createQuestion(data: CreateQuestionData): Promise<Question> {
  const response = await fetchWithAuth('/questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create question');
  }

  return response.json();
}

/**
 * Delete a question
 */
export async function deleteQuestion(questionId: string): Promise<void> {
  const response = await fetchWithAuth(`/questions/${questionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete question');
  }
}
