/**
 * SAM Memory Repository Interface and Implementation
 */

import { SamMemoryEntry } from '../domain/types';

export interface IMemoryRepo {
  create(entry: SamMemoryEntry): Promise<SamMemoryEntry>;
  update(id: string, entry: Partial<SamMemoryEntry>): Promise<SamMemoryEntry>;
  get(id: string): Promise<SamMemoryEntry | null>;
  getMany(ids: string[]): Promise<SamMemoryEntry[]>;
  list(filter?: MemoryFilter): Promise<SamMemoryEntry[]>;
  delete(id: string): Promise<boolean>;
  archive(id: string): Promise<boolean>;
  restore(id: string): Promise<boolean>;
  count(filter?: MemoryFilter): Promise<number>;
  getVersionHistory(id: string): Promise<SamMemoryEntry[]>;
}

export interface MemoryFilter {
  archive_flag?: boolean;
  tags?: string[];
  reliability?: string[];
  min_confidence?: number;
  context_applies_to?: string[];
  search_text?: string;
  limit?: number;
  offset?: number;
}

/**
 * In-memory implementation for SAM repository
 * TODO: Replace with actual database persistence
 */
export class InMemoryRepo implements IMemoryRepo {
  private memories: Map<string, SamMemoryEntry> = new Map();
  private versionHistory: Map<string, SamMemoryEntry[]> = new Map();

  async create(entry: SamMemoryEntry): Promise<SamMemoryEntry> {
    this.memories.set(entry.id, { ...entry });
    this.versionHistory.set(entry.id, [{ ...entry }]);
    return { ...entry };
  }

  async update(id: string, partial: Partial<SamMemoryEntry>): Promise<SamMemoryEntry> {
    const existing = this.memories.get(id);
    if (!existing) {
      throw new Error(`Memory ${id} not found`);
    }

    const updated: SamMemoryEntry = {
      ...existing,
      ...partial,
      id, // Preserve ID
      version: existing.version + 1,
      updated_at: new Date().toISOString()
    };

    this.memories.set(id, updated);

    // Store version history
    const history = this.versionHistory.get(id) || [];
    history.push({ ...updated });
    this.versionHistory.set(id, history);

    return { ...updated };
  }

  async get(id: string): Promise<SamMemoryEntry | null> {
    const entry = this.memories.get(id);
    return entry ? { ...entry } : null;
  }

  async getMany(ids: string[]): Promise<SamMemoryEntry[]> {
    const results: SamMemoryEntry[] = [];
    for (const id of ids) {
      const entry = this.memories.get(id);
      if (entry) {
        results.push({ ...entry });
      }
    }
    return results;
  }

  async list(filter: MemoryFilter = {}): Promise<SamMemoryEntry[]> {
    let results = Array.from(this.memories.values());

    // Apply filters
    if (filter.archive_flag !== undefined) {
      results = results.filter(m => m.archive_flag === filter.archive_flag);
    }

    if (filter.tags && filter.tags.length > 0) {
      results = results.filter(m =>
        filter.tags!.some(tag => m.tags.includes(tag.toLowerCase()))
      );
    }

    if (filter.reliability && filter.reliability.length > 0) {
      results = results.filter(m => filter.reliability!.includes(m.reliability));
    }

    if (filter.min_confidence !== undefined) {
      results = results.filter(m => m.confidence_score >= filter.min_confidence!);
    }

    if (filter.context_applies_to && filter.context_applies_to.length > 0) {
      results = results.filter(m =>
        filter.context_applies_to!.some(ctx =>
          m.context_window.applies_to.includes(ctx)
        )
      );
    }

    if (filter.search_text) {
      const searchLower = filter.search_text.toLowerCase();
      results = results.filter(m =>
        m.title.toLowerCase().includes(searchLower) ||
        m.content.toLowerCase().includes(searchLower) ||
        m.summary.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    if (filter.offset !== undefined) {
      results = results.slice(filter.offset);
    }
    if (filter.limit !== undefined) {
      results = results.slice(0, filter.limit);
    }

    return results.map(m => ({ ...m }));
  }

  async delete(id: string): Promise<boolean> {
    return this.memories.delete(id);
  }

  async archive(id: string): Promise<boolean> {
    const entry = this.memories.get(id);
    if (!entry) return false;

    entry.archive_flag = true;
    entry.updated_at = new Date().toISOString();
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const entry = this.memories.get(id);
    if (!entry) return false;

    entry.archive_flag = false;
    entry.updated_at = new Date().toISOString();
    return true;
  }

  async count(filter: MemoryFilter = {}): Promise<number> {
    const filtered = await this.list(filter);
    return filtered.length;
  }

  async getVersionHistory(id: string): Promise<SamMemoryEntry[]> {
    const history = this.versionHistory.get(id);
    return history ? history.map(v => ({ ...v })) : [];
  }
}
