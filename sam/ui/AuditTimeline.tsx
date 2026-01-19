/**
 * SAM Audit Timeline - Show event history for a memory
 */

import React, { useEffect, useState } from 'react';
import { AuditEvent } from '../services/AuditService';

interface AuditTimelineProps {
  memoryId: string;
  onClose?: () => void;
}

export function AuditTimeline({ memoryId, onClose }: AuditTimelineProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [memoryId]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // TODO: Call AuditService.getHistory(memoryId)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const formatEventType = (type: string): string => {
    return type
      .replace(/_/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="audit-timeline">
      <div className="timeline-header">
        <h3>Audit Timeline</h3>
        {onClose && (
          <button onClick={onClose} className="close-btn">&times;</button>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading timeline...</div>
      ) : events.length === 0 ? (
        <div className="empty">No audit events found.</div>
      ) : (
        <div className="timeline-events">
          {events.map((event, index) => (
            <div key={index} className={`timeline-event ${event.event_type}`}>
              <div className="event-marker" />
              <div className="event-content">
                <div className="event-header">
                  <strong>{formatEventType(event.event_type)}</strong>
                  <span className="timestamp">{formatTimestamp(event.timestamp)}</span>
                </div>

                {event.details && Object.keys(event.details).length > 0 && (
                  <div className="event-details">
                    {event.event_type === 'memory_recalled' && (
                      <>
                        <p><strong>Query:</strong> {event.details.query_text}</p>
                        <p><strong>Task:</strong> {event.details.active_task}</p>
                        <p><strong>Score:</strong> {event.details.top_score}</p>
                      </>
                    )}

                    {event.event_type === 'memory_updated' && event.details.changelog && (
                      <div className="changelog">
                        <strong>Changes:</strong>
                        <ul>
                          {event.details.changelog.map((change: any, i: number) => (
                            <li key={i}>
                              <code>{change.path}</code>: {change.reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {event.event_type === 'memory_created' && (
                      <p><strong>Title:</strong> {event.details.title}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
