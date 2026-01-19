/**
 * SAM Memory List - Browse and manage memories
 */

import React, { useState, useEffect } from 'react';
import { SamMemoryEntry } from '../domain/types';
import { MemoryFilter } from '../repo/MemoryRepo';

interface MemoryListProps {
  onCreateNew: () => void;
  onSelect: (memory: SamMemoryEntry) => void;
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function MemoryList({ onCreateNew, onSelect, onEdit, onArchive, onDelete }: MemoryListProps) {
  const [memories, setMemories] = useState<SamMemoryEntry[]>([]);
  const [filter, setFilter] = useState<MemoryFilter>({
    archive_flag: false,
    limit: 50,
    offset: 0
  });
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadMemories();
  }, [filter]);

  const loadMemories = async () => {
    setLoading(true);
    try {
      // TODO: Call actual MemoryRepo.list(filter)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      setMemories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilter(f => ({ ...f, search_text: searchText, offset: 0 }));
  };

  const handleToggleArchived = () => {
    setFilter(f => ({ ...f, archive_flag: !f.archive_flag, offset: 0 }));
  };

  return (
    <div className="memory-list">
      <div className="list-header">
        <h2>Semantic Anchor Memories</h2>
        <button onClick={onCreateNew} className="create-btn">+ New Memory</button>
      </div>

      <div className="list-controls">
        <div className="search-bar">
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search memories..."
          />
          <button onClick={handleSearch}>Search</button>
        </div>

        <div className="filters">
          <label>
            <input
              type="checkbox"
              checked={filter.archive_flag ?? false}
              onChange={handleToggleArchived}
            />
            Show archived
          </label>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading memories...</div>
      ) : memories.length === 0 ? (
        <div className="empty-state">
          <p>No memories found.</p>
          <button onClick={onCreateNew}>Create your first memory</button>
        </div>
      ) : (
        <div className="memory-grid">
          {memories.map(memory => (
            <div
              key={memory.id}
              className={`memory-card ${memory.archive_flag ? 'archived' : ''}`}
              onClick={() => onSelect(memory)}
            >
              <div className="card-header">
                <h3>{memory.title}</h3>
                <div className="badges">
                  <span className={`reliability ${memory.reliability}`}>
                    {memory.reliability}
                  </span>
                  <span className="confidence">
                    {(memory.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <p className="summary">{memory.summary}</p>

              <div className="tags">
                {memory.tags.slice(0, 5).map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
                {memory.tags.length > 5 && (
                  <span className="tag more">+{memory.tags.length - 5}</span>
                )}
              </div>

              <div className="card-footer">
                <span className="usage">Used {memory.usage_count} times</span>
                <div className="actions">
                  {onEdit && (
                    <button onClick={e => (e.stopPropagation(), onEdit(memory.id))}>
                      Edit
                    </button>
                  )}
                  {onArchive && !memory.archive_flag && (
                    <button onClick={e => (e.stopPropagation(), onArchive(memory.id))}>
                      Archive
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={e => (e.stopPropagation(), onDelete(memory.id))} className="danger">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
