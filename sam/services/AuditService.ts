/**
 * SAM Audit Service - Event logging and tracking
 */

export interface AuditEvent {
  event_type: string;
  memory_id: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface IAuditService {
  append(event: AuditEvent): Promise<void>;
  getHistory(memoryId: string): Promise<AuditEvent[]>;
  getTimeline(filter?: { limit?: number; offset?: number }): Promise<AuditEvent[]>;
}

/**
 * In-memory audit log
 * TODO: Persist to database
 */
export class AuditService implements IAuditService {
  private events: AuditEvent[] = [];

  async append(event: AuditEvent): Promise<void> {
    this.events.push({ ...event });
  }

  async getHistory(memoryId: string): Promise<AuditEvent[]> {
    return this.events
      .filter(e => e.memory_id === memoryId)
      .map(e => ({ ...e }));
  }

  async getTimeline(filter: { limit?: number; offset?: number } = {}): Promise<AuditEvent[]> {
    let results = [...this.events];

    // Sort by timestamp descending
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    if (filter.offset !== undefined) {
      results = results.slice(filter.offset);
    }
    if (filter.limit !== undefined) {
      results = results.slice(0, filter.limit);
    }

    return results;
  }
}
