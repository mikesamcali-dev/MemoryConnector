import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api/client';
import '../styles/sam-memories.css';

interface SamMemory {
  id: string;
  title: string;
  content: string;
  summary: string;
  canonicalPhrases: string[];
  tags: string[];
  confidenceScore: number;
  reliability: string;
  usageCount: number;
  archiveFlag: boolean;
  createdAt: string;
  updatedAt: string;
}

export function SamMemoriesPage() {
  const [memories, setMemories] = useState<SamMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMemory, setNewMemory] = useState({
    title: '',
    content: '',
    tags: '',
    reliability: 'confirmed',
    confidence_score: 0.75,
    context_window: { applies_to: [], excludes: [] },
    decay_policy: { type: 'exponential', half_life_days: 90, min_confidence: 0.4 }
  });

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/sam');
      const data = await response.json();
      setMemories(data);
    } catch (error) {
      console.error('Failed to load SAM memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/sam', {
        method: 'POST',
        body: JSON.stringify({
          ...newMemory,
          tags: newMemory.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });

      setNewMemory({
        title: '',
        content: '',
        tags: '',
        reliability: 'confirmed',
        confidence_score: 0.75,
        context_window: { applies_to: [], excludes: [] },
        decay_policy: { type: 'exponential', half_life_days: 90, min_confidence: 0.4 }
      });
      setShowCreateForm(false);
      loadMemories();
    } catch (error) {
      console.error('Failed to create memory:', error);
      alert('Failed to create memory. Please try again.');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await fetchWithAuth(`/sam/${id}/archive`, { method: 'PUT' });
      loadMemories();
    } catch (error) {
      console.error('Failed to archive memory:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;

    try {
      await fetchWithAuth(`/sam/${id}`, { method: 'DELETE' });
      loadMemories();
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  };

  return (
    <div className="sam-memories-page">
      <div className="page-header">
        <h1>Semantic Anchor Memories (SAM)</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary"
        >
          {showCreateForm ? 'Cancel' : '+ New Memory'}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form-card">
          <h2>Create New Memory</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={newMemory.title}
                onChange={e => setNewMemory({ ...newMemory, title: e.target.value })}
                required
                maxLength={120}
              />
            </div>

            <div className="form-group">
              <label>Content *</label>
              <textarea
                value={newMemory.content}
                onChange={e => setNewMemory({ ...newMemory, content: e.target.value })}
                required
                rows={8}
                maxLength={8000}
              />
            </div>

            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                value={newMemory.tags}
                onChange={e => setNewMemory({ ...newMemory, tags: e.target.value })}
                placeholder="ui, api, preference"
              />
            </div>

            <div className="form-group">
              <label>Confidence: {newMemory.confidence_score.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={newMemory.confidence_score}
                onChange={e => setNewMemory({ ...newMemory, confidence_score: parseFloat(e.target.value) })}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">Create Memory</button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading memories...</div>
      ) : memories.length === 0 ? (
        <div className="empty-state">
          <p>No SAM memories yet. Create your first one!</p>
        </div>
      ) : (
        <div className="memories-grid">
          {memories.map(memory => (
            <div key={memory.id} className={`memory-card ${memory.archiveFlag ? 'archived' : ''}`}>
              <div className="memory-header">
                <h3>{memory.title}</h3>
                <div className="badges">
                  <span className={`reliability ${memory.reliability}`}>
                    {memory.reliability}
                  </span>
                  <span className="confidence">
                    {(memory.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <p className="summary">{memory.summary}</p>

              <div className="canonical-phrases">
                <strong>Canonical Phrases:</strong>
                <ul>
                  {memory.canonicalPhrases.slice(0, 3).map((phrase, i) => (
                    <li key={i}>{phrase}</li>
                  ))}
                  {memory.canonicalPhrases.length > 3 && (
                    <li>+{memory.canonicalPhrases.length - 3} more</li>
                  )}
                </ul>
              </div>

              <div className="tags">
                {memory.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>

              <div className="memory-footer">
                <span className="usage">Used {memory.usageCount} times</span>
                <div className="actions">
                  {!memory.archiveFlag && (
                    <button onClick={() => handleArchive(memory.id)} className="btn-small">
                      Archive
                    </button>
                  )}
                  <button onClick={() => handleDelete(memory.id)} className="btn-small btn-danger">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
