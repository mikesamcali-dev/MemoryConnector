/**
 * Embeddings service interface for SAM
 */

export interface EmbeddingResult {
  vector: number[];
  dims: number;
  model: string;
  text_hash: string;
}

export interface IEmbeddingsService {
  generate(text: string, model: string): Promise<EmbeddingResult>;
  generateBatch(texts: string[], model: string): Promise<EmbeddingResult[]>;
}

/**
 * Mock embeddings service
 * TODO: Integrate with actual OpenAI embeddings service from apps/api/src/embeddings
 */
export class MockEmbeddingsService implements IEmbeddingsService {
  private cache: Map<string, EmbeddingResult> = new Map();

  async generate(text: string, model: string): Promise<EmbeddingResult> {
    const hash = this.hashText(text);

    // Check cache
    if (this.cache.has(hash)) {
      return { ...this.cache.get(hash)! };
    }

    // Generate mock embedding (deterministic based on text hash)
    const dims = 1536; // Match text-embedding-ada-002
    const vector = this.generateMockVector(text, dims);

    const result: EmbeddingResult = {
      vector,
      dims,
      model,
      text_hash: hash
    };

    this.cache.set(hash, result);
    return { ...result };
  }

  async generateBatch(texts: string[], model: string): Promise<EmbeddingResult[]> {
    return Promise.all(texts.map(text => this.generate(text, model)));
  }

  private hashText(text: string): string {
    // Simple hash function for demonstration
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private generateMockVector(text: string, dims: number): number[] {
    // Generate deterministic mock vector based on text
    const hash = this.hashText(text);
    const seed = parseInt(hash, 16);

    const vector: number[] = [];
    let rng = seed;

    for (let i = 0; i < dims; i++) {
      // Simple LCG random number generator for determinism
      rng = (rng * 1664525 + 1013904223) % 4294967296;
      vector.push((rng / 4294967296) - 0.5);
    }

    // Normalize to unit vector
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / norm);
  }
}

/**
 * Adapter to integrate with existing Memory Connector embeddings service
 * TODO: Implement actual integration
 */
export class MemoryConnectorEmbeddingsAdapter implements IEmbeddingsService {
  // This would wrap the existing embeddings service from apps/api/src/embeddings
  // For now, delegate to mock
  private mock = new MockEmbeddingsService();

  async generate(text: string, model: string): Promise<EmbeddingResult> {
    // TODO: Call existing embeddings service
    // const result = await this.existingService.generateEmbedding(text);
    // return { vector: result.vector, dims: result.dimensions, model, text_hash: ... };
    return this.mock.generate(text, model);
  }

  async generateBatch(texts: string[], model: string): Promise<EmbeddingResult[]> {
    return this.mock.generateBatch(texts, model);
  }
}
