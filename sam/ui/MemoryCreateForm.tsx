/**
 * SAM Memory Creation Form with Live Preview
 */

import React, { useMemo, useState } from 'react';
import {
  SamMemoryDraft,
  SamMemoryEntry,
  SamEnrichmentPreview,
  SamTrainingExample
} from '../domain/types';
import { normalizeForStorage } from '../domain/normalize';
import { redactMemoryDraft } from '../domain/redact';
import { MemoryService } from '../services/MemoryService';
import { TrainingService } from '../services/TrainingService';

interface MemoryCreateFormProps {
  initial?: Partial<SamMemoryDraft>;
  onSaved: (entry: SamMemoryEntry) => void;
  onCancel?: () => void;
}

export function MemoryCreateForm({ initial, onSaved, onCancel }: MemoryCreateFormProps) {
  const [draft, setDraft] = useState<SamMemoryDraft>({
    title: initial?.title ?? '',
    content: initial?.content ?? '',
    tags: initial?.tags ?? [],
    reliability: initial?.reliability ?? 'unverified',
    confidence_score: initial?.confidence_score ?? 0.75,
    context_window: initial?.context_window ?? { applies_to: [], excludes: [] },
    decay_policy: initial?.decay_policy ?? {
      type: 'exponential',
      half_life_days: 90,
      min_confidence: 0.4
    },
    source: initial?.source ?? { type: 'user', ref: 'cursor_ui', uri: null },
    training_examples: initial?.training_examples ?? []
  });

  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live preview
  const preview: SamEnrichmentPreview = useMemo(() => {
    if (!draft.title || !draft.content) {
      return {
        summary: '',
        canonical_phrases: [],
        suggested_tags: [],
        pii_warnings: [],
        embedding_ready: false
      };
    }

    const norm = normalizeForStorage(draft);
    const { draft: redacted, report } = redactMemoryDraft(norm);
    const enrichment = MemoryService.previewEnrichment(redacted);

    return {
      ...enrichment,
      pii_warnings: report.items.map(item => `${item.pattern} detected in ${item.path}`)
    };
  }, [draft.title, draft.content]);

  const handleAddTag = () => {
    if (tagInput.trim() && !draft.tags.includes(tagInput.trim().toLowerCase())) {
      setDraft(d => ({
        ...d,
        tags: [...d.tags, tagInput.trim().toLowerCase()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setDraft(d => ({
      ...d,
      tags: d.tags.filter(t => t !== tag)
    }));
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);

    try {
      // In real implementation, call MemoryService.createFromDraft
      // For now, simulate success
      console.log('Creating memory:', draft, preview);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock created entry
      const created: SamMemoryEntry = {
        id: `mem_${Date.now()}`,
        ...draft,
        summary: preview.summary,
        canonical_phrases: preview.canonical_phrases,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0,
        last_used_at: null,
        archive_flag: false,
        version: 1,
        embeddings: {
          model: 'text-embedding-ada-002',
          dims: 1536,
          vector_ref: `vec://mem_${Date.now()}`
        }
      };

      onSaved(created);
    } catch (err: any) {
      setError(err.message || 'Failed to save memory');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sam-memory-form">
      <div className="form-layout">
        {/* Left: Input Fields */}
        <div className="form-inputs">
          <h2>Create Memory</h2>

          {error && (
            <div className="error-banner">{error}</div>
          )}

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={draft.title}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              placeholder="Brief, descriptive title"
              maxLength={120}
              required
            />
            <small>{draft.title.length}/120</small>
          </div>

          {/* Content */}
          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              value={draft.content}
              onChange={e => setDraft(d => ({ ...d, content: e.target.value }))}
              placeholder="Detailed memory content..."
              rows={8}
              maxLength={8000}
              required
            />
            <small>{draft.content.length}/8000</small>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <div className="tag-input">
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tags..."
              />
              <button type="button" onClick={handleAddTag}>Add</button>
            </div>
            <div className="tag-list">
              {draft.tags.map(tag => (
                <span key={tag} className="tag">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)}>&times;</button>
                </span>
              ))}
            </div>
          </div>

          {/* Confidence */}
          <div className="form-group">
            <label htmlFor="confidence">
              Confidence: {draft.confidence_score.toFixed(2)}
            </label>
            <input
              id="confidence"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={draft.confidence_score}
              onChange={e => setDraft(d => ({ ...d, confidence_score: parseFloat(e.target.value) }))}
            />
          </div>

          {/* Reliability */}
          <div className="form-group">
            <label htmlFor="reliability">Reliability</label>
            <select
              id="reliability"
              value={draft.reliability}
              onChange={e => setDraft(d => ({ ...d, reliability: e.target.value as any }))}
            >
              <option value="unverified">Unverified</option>
              <option value="inferred">Inferred</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleSave}
              disabled={!draft.title || !draft.content || saving || !preview.embedding_ready}
            >
              {saving ? 'Saving...' : 'Save Memory'}
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="secondary">
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="form-preview">
          <h3>Preview</h3>

          {preview.pii_warnings.length > 0 && (
            <div className="warning-banner">
              <strong>PII Detected:</strong>
              <ul>
                {preview.pii_warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="preview-section">
            <h4>Summary</h4>
            <p>{preview.summary || <em>Enter content to generate summary</em>}</p>
          </div>

          <div className="preview-section">
            <h4>Canonical Phrases</h4>
            {preview.canonical_phrases.length > 0 ? (
              <ul>
                {preview.canonical_phrases.map((phrase, i) => (
                  <li key={i}>{phrase}</li>
                ))}
              </ul>
            ) : (
              <em>No phrases generated yet</em>
            )}
          </div>

          <div className="preview-section">
            <h4>Suggested Tags</h4>
            {preview.suggested_tags.length > 0 ? (
              <div className="tag-list">
                {preview.suggested_tags.map(tag => (
                  <span key={tag} className="tag suggested">{tag}</span>
                ))}
              </div>
            ) : (
              <em>No tag suggestions</em>
            )}
          </div>

          <div className="preview-section">
            <h4>Embedding Status</h4>
            <div className={preview.embedding_ready ? 'status-ready' : 'status-pending'}>
              {preview.embedding_ready ? '✓ Ready for embedding' : '⏳ Needs more content'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
