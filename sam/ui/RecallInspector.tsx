/**
 * SAM Recall Inspector - Show recalled memories with rationales
 */

import React from 'react';
import { RankedMemory } from '../domain/types';

interface RecallInspectorProps {
  memories: RankedMemory[];
  onApply?: (memoryId: string) => void;
  onDismiss?: (memoryId: string) => void;
}

export function RecallInspector({ memories, onApply, onDismiss }: RecallInspectorProps) {
  if (memories.length === 0) {
    return (
      <div className="recall-inspector empty">
        <p>No memories recalled for current context.</p>
      </div>
    );
  }

  return (
    <div className="recall-inspector">
      <h3>Recalled Memories ({memories.length})</h3>

      <div className="recalled-list">
        {memories.map(memory => (
          <div key={memory.id} className="recalled-card">
            <div className="card-header">
              <h4>{memory.title}</h4>
              <div className="score-badge" title={`Composite score: ${memory.score}`}>
                {(memory.score * 100).toFixed(0)}%
              </div>
            </div>

            <p className="summary">{memory.summary}</p>

            {/* Rationale */}
            <div className="rationale">
              <strong>Why recalled:</strong> {memory.rationale}
            </div>

            {/* Signals breakdown */}
            <div className="signals">
              <div className="signal">
                <span className="label">Semantic:</span>
                <div className="bar">
                  <div
                    className="fill semantic"
                    style={{ width: `${memory.signals.semantic * 100}%` }}
                  />
                </div>
                <span className="value">{(memory.signals.semantic * 100).toFixed(0)}%</span>
              </div>

              <div className="signal">
                <span className="label">Exact:</span>
                <div className="bar">
                  <div
                    className="fill exact"
                    style={{ width: `${memory.signals.exact * 100}%` }}
                  />
                </div>
                <span className="value">{(memory.signals.exact * 100).toFixed(0)}%</span>
              </div>

              <div className="signal">
                <span className="label">Recency:</span>
                <div className="bar">
                  <div
                    className="fill recency"
                    style={{ width: `${memory.signals.recency * 100}%` }}
                  />
                </div>
                <span className="value">{(memory.signals.recency * 100).toFixed(0)}%</span>
              </div>

              <div className="signal">
                <span className="label">Confidence:</span>
                <div className="bar">
                  <div
                    className="fill confidence"
                    style={{ width: `${memory.signals.confidence * 100}%` }}
                  />
                </div>
                <span className="value">{(memory.signals.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Highlights */}
            {memory.highlights.length > 0 && (
              <div className="highlights">
                <strong>Highlights:</strong>
                {memory.highlights.map((highlight, i) => (
                  <div key={i} className="highlight">{highlight}</div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="card-actions">
              {onApply && (
                <button onClick={() => onApply(memory.id)} className="apply-btn">
                  Apply
                </button>
              )}
              {onDismiss && (
                <button onClick={() => onDismiss(memory.id)} className="dismiss-btn">
                  Dismiss
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
