/**
 * Vector Index Interface for SAM
 */

export interface VectorMetadata {
  memoryId: string;
  archive_flag?: boolean;
  tags?: string[];
  [key: string]: any;
}

export interface VectorSearchHit {
  id: string;
  score: number;
  metadata?: VectorMetadata;
}

export interface VectorFilter {
  archive_flag?: boolean;
  tags?: string[];
  [key: string]: any;
}

export interface IVectorIndex {
  upsert(id: string, vector: number[], metadata: VectorMetadata): Promise<void>;
  query(vector: number[], topK: number, filter?: VectorFilter): Promise<VectorSearchHit[]>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}

/**
 * Mock in-memory vector index for SAM
 * TODO: Replace with actual pgvector integration
 */
export class MockVectorIndex implements IVectorIndex {
  private vectors: Map<string, { vector: number[]; metadata: VectorMetadata }> = new Map();

  async upsert(id: string, vector: number[], metadata: VectorMetadata): Promise<void> {
    this.vectors.set(id, { vector: [...vector], metadata: { ...metadata } });
  }

  async query(queryVector: number[], topK: number, filter?: VectorFilter): Promise<VectorSearchHit[]> {
    let candidates = Array.from(this.vectors.entries());

    // Apply filters
    if (filter) {
      if (filter.archive_flag !== undefined) {
        candidates = candidates.filter(([_, v]) => v.metadata.archive_flag === filter.archive_flag);
      }
      if (filter.tags && filter.tags.length > 0) {
        candidates = candidates.filter(([_, v]) =>
          filter.tags!.some(tag => v.metadata.tags?.includes(tag))
        );
      }
    }

    // Calculate cosine similarity
    const scored = candidates.map(([id, { vector, metadata }]) => ({
      id,
      score: cosineSimilarity(queryVector, vector),
      metadata
    }));

    // Sort by score descending and take top K
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  async delete(id: string): Promise<boolean> {
    return this.vectors.delete(id);
  }

  async count(): Promise<number> {
    return this.vectors.size;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}
