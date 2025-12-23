export function generateIdempotencyKey(): string {
  return `${crypto.randomUUID()}-${Date.now()}`;
}

export interface MemoryDraft {
  text?: string;
  imageUrl?: string;
  idempotencyKey: string;
  createdAt: number;
}

export function createDraft(text?: string, imageUrl?: string): MemoryDraft {
  return {
    text,
    imageUrl,
    idempotencyKey: generateIdempotencyKey(),
    createdAt: Date.now(),
  };
}

