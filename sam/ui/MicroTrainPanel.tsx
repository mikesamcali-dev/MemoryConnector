/**
 * SAM Micro-Training Panel - Manage and test training examples
 */

import React, { useState } from 'react';
import { SamTrainingExample } from '../domain/types';
import { TrainingService, TrainingTestReport } from '../services/TrainingService';

interface MicroTrainPanelProps {
  examples: SamTrainingExample[];
  onChange: (examples: SamTrainingExample[]) => void;
  onRunTests?: () => Promise<TrainingTestReport>;
}

export function MicroTrainPanel({ examples, onChange, onRunTests }: MicroTrainPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testReport, setTestReport] = useState<TrainingTestReport | null>(null);
  const [testing, setTesting] = useState(false);

  const handleAdd = () => {
    const newExample: SamTrainingExample = {
      id: `tr_${Date.now()}`,
      user: '',
      assistant: '',
      assertions: [],
      last_tested_at: null,
      pass_rate: 0.0
    };
    onChange([...examples, newExample]);
    setEditingId(newExample.id);
  };

  const handleUpdate = (id: string, updates: Partial<SamTrainingExample>) => {
    onChange(examples.map(ex => ex.id === id ? { ...ex, ...updates } : ex));
  };

  const handleDelete = (id: string) => {
    onChange(examples.filter(ex => ex.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleRunTests = async () => {
    if (!onRunTests) return;

    setTesting(true);
    try {
      const report = await onRunTests();
      setTestReport(report);
    } catch (err) {
      console.error('Test run failed:', err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="micro-train-panel">
      <div className="panel-header">
        <h3>Training Examples</h3>
        <button onClick={handleAdd} className="add-btn">+ Add Example</button>
      </div>

      {examples.length === 0 ? (
        <div className="empty-state">
          <p>No training examples yet. Add examples to validate memory recall behavior.</p>
        </div>
      ) : (
        <div className="examples-list">
          {examples.map(example => {
            const isEditing = editingId === example.id;
            const testResult = testReport?.results.find(r => r.example_id === example.id);

            return (
              <div key={example.id} className={`example-card ${testResult?.passed ? 'passed' : testResult ? 'failed' : ''}`}>
                <div className="example-header">
                  <span className="example-id">{example.id}</span>
                  {example.last_tested_at && (
                    <span className="test-status">
                      Pass rate: {(example.pass_rate * 100).toFixed(0)}%
                    </span>
                  )}
                  <button onClick={() => handleDelete(example.id)} className="delete-btn">
                    Delete
                  </button>
                </div>

                <div className="example-body">
                  {/* User prompt */}
                  <div className="field">
                    <label>User Prompt:</label>
                    {isEditing ? (
                      <textarea
                        value={example.user}
                        onChange={e => handleUpdate(example.id, { user: e.target.value })}
                        placeholder="User prompt that should trigger this memory..."
                        rows={2}
                      />
                    ) : (
                      <p className="user-text">{example.user || <em>Empty</em>}</p>
                    )}
                  </div>

                  {/* Expected assistant response */}
                  <div className="field">
                    <label>Expected Assistant Response:</label>
                    {isEditing ? (
                      <textarea
                        value={example.assistant}
                        onChange={e => handleUpdate(example.id, { assistant: e.target.value })}
                        placeholder="Expected behavior showing memory applied..."
                        rows={3}
                      />
                    ) : (
                      <p className="assistant-text">{example.assistant || <em>Empty</em>}</p>
                    )}
                  </div>

                  {/* Assertions */}
                  <div className="field">
                    <label>Assertions (comma-separated):</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={example.assertions.join(', ')}
                        onChange={e =>
                          handleUpdate(example.id, {
                            assertions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })
                        }
                        placeholder="keyword1, keyword2, forbidden:badword"
                      />
                    ) : (
                      <div className="assertions-list">
                        {example.assertions.map((assertion, i) => (
                          <span key={i} className={assertion.startsWith('forbidden:') ? 'forbidden' : 'required'}>
                            {assertion}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {testResult && !testResult.passed && (
                    <div className="test-errors">
                      <strong>Errors:</strong>
                      <ul>
                        {testResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="example-footer">
                  {isEditing ? (
                    <button onClick={() => setEditingId(null)} className="done-btn">
                      Done
                    </button>
                  ) : (
                    <button onClick={() => setEditingId(example.id)} className="edit-btn">
                      Edit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {examples.length > 0 && onRunTests && (
        <div className="panel-footer">
          <button onClick={handleRunTests} disabled={testing} className="run-tests-btn">
            {testing ? 'Running Tests...' : 'Run Tests'}
          </button>

          {testReport && (
            <div className="test-summary">
              <span className="passed">{testReport.passed} passed</span>
              <span className="failed">{testReport.failed} failed</span>
              <span className="total">{testReport.total} total</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
