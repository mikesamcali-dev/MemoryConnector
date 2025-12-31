import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  getSystemStats,
  getAICostTracking,
  getEnrichmentWorkerStatus,
  getMemoryTypes,
  getAllWords,
  getWord,
  enrichWord,
  triggerEnrichment,
  createMemoryType,
  updateMemoryType,
  deleteMemoryType,
  getAllUsers,
  getAllMemoriesByUser,
  getFailedJobs,
} from '../api/admin';
import {
  Users,
  Database,
  TrendingUp,
  DollarSign,
  Activity,
  Play,
  Edit2,
  Trash2,
  Plus,
  X,
  AlertCircle,
  Brain,
  AlertTriangle,
  ScrollText,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showMemoriesModal, setShowMemoriesModal] = useState(false);
  const [showFailedJobsModal, setShowFailedJobsModal] = useState(false);
  const [memoriesSearchTerm, setMemoriesSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    color: '#3B82F6',
  });

  // Fetch data
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getSystemStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: aiCosts, isLoading: loadingCosts } = useQuery({
    queryKey: ['admin-ai-costs'],
    queryFn: getAICostTracking,
    refetchInterval: 30000,
  });

  const { data: workerStatus, isLoading: loadingWorker } = useQuery({
    queryKey: ['admin-worker'],
    queryFn: getEnrichmentWorkerStatus,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: memoryTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ['admin-memory-types'],
    queryFn: getMemoryTypes,
  });

  const { data: words, isLoading: loadingWords } = useQuery({
    queryKey: ['admin-words'],
    queryFn: getAllWords,
  });

  const { data: selectedWord, error: selectedWordError, isLoading: selectedWordLoading } = useQuery({
    queryKey: ['admin-word', selectedWordId],
    queryFn: async () => {
      console.log('Fetching word:', selectedWordId);
      try {
        const result = await getWord(selectedWordId!);
        console.log('Word data received:', result);
        return result;
      } catch (err) {
        console.error('Error fetching word:', err);
        throw err;
      }
    },
    enabled: !!selectedWordId,
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAllUsers,
    enabled: showUsersModal,
  });

  const { data: memoriesByUser, isLoading: loadingMemoriesByUser } = useQuery({
    queryKey: ['admin-memories-by-user'],
    queryFn: getAllMemoriesByUser,
    enabled: showMemoriesModal,
  });

  const { data: failedJobs, isLoading: loadingFailedJobs } = useQuery({
    queryKey: ['admin-failed-jobs'],
    queryFn: getFailedJobs,
    enabled: showFailedJobsModal,
  });

  // Mutations
  const triggerMutation = useMutation({
    mutationFn: triggerEnrichment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-worker'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: createMemoryType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-memory-types'] });
      setShowCreateModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateMemoryType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-memory-types'] });
      setEditingType(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMemoryType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-memory-types'] });
    },
  });

  const enrichWordMutation = useMutation({
    mutationFn: enrichWord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-words'] });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', slug: '', icon: '', color: '#3B82F6' });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ id: editingType.id, data: formData });
  };

  const startEdit = (type: any) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      slug: type.slug,
      icon: type.icon,
      color: type.color,
    });
  };

  const isLoading = loadingStats || loadingCosts || loadingWorker || loadingTypes || loadingWords;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  const circuitBreakerColor =
    aiCosts?.dailySpend.circuitState === 'CLOSED'
      ? 'text-green-600'
      : aiCosts?.dailySpend.circuitState === 'QUEUE_ONLY'
      ? 'text-yellow-600'
      : 'text-red-600';

  const circuitBreakerBg =
    aiCosts?.dailySpend.circuitState === 'CLOSED'
      ? 'bg-green-50'
      : aiCosts?.dailySpend.circuitState === 'QUEUE_ONLY'
      ? 'bg-yellow-50'
      : 'bg-red-50';

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">System monitoring and management</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 flex gap-3 flex-wrap">
        <Link
          to="/app/admin/extraction-data"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Brain className="h-5 w-5" />
          View LLM Extraction Data
        </Link>
        <Link
          to="/app/admin/enrichment-failures"
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <AlertTriangle className="h-5 w-5" />
          Enrichment Failures
        </Link>
        <Link
          to="/app/admin/words"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Database className="h-5 w-5" />
          Manage Words
        </Link>
        <Link
          to="/app/admin/audit-trail"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <ScrollText className="h-5 w-5" />
          Audit Trail
        </Link>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <button
          onClick={() => setShowUsersModal(true)}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.users || 0}</p>
          <p className="text-sm text-blue-600 mt-2">Click to view details →</p>
        </button>

        <button
          onClick={() => setShowMemoriesModal(true)}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Memories</h3>
            <Database className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.memories || 0}</p>
          <p className="text-sm text-gray-500 mt-1">+{stats?.memoriesToday || 0} today</p>
          <p className="text-sm text-purple-600 mt-2">Click to view by user →</p>
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Embeddings</h3>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.embeddings || 0}</p>
        </div>
      </div>

      {/* AI Cost Tracking */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI Cost Tracking</h2>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${circuitBreakerBg}`}>
            <Activity className={`h-4 w-4 ${circuitBreakerColor}`} />
            <span className={`text-sm font-medium ${circuitBreakerColor}`}>
              {aiCosts?.dailySpend.circuitState || 'UNKNOWN'}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Daily Spend</span>
            <span className="text-sm font-medium text-gray-900">
              ${((aiCosts?.dailySpend.totalCents || 0) / 100).toFixed(4)}
              <span className="text-gray-500 ml-1">({aiCosts?.dailySpend.operationCount || 0} operations)</span>
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${
                (aiCosts?.dailySpend.percentUsed || 0) >= 100
                  ? 'bg-red-600'
                  : (aiCosts?.dailySpend.percentUsed || 0) >= 80
                  ? 'bg-yellow-600'
                  : 'bg-green-600'
              }`}
              style={{ width: `${Math.min(aiCosts?.dailySpend.percentUsed || 0, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-1">{aiCosts?.dailySpend.percentUsed.toFixed(1)}% used</p>
        </div>

        {aiCosts?.todayCostsByOperation && aiCosts.todayCostsByOperation.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Cost by Operation</h3>
            <div className="space-y-2">
              {aiCosts.todayCostsByOperation.map((op) => (
                <div key={op.operation} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{op.operation}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{op.count} calls</span>
                    <span className="font-medium text-gray-900">${(op.totalCents / 100).toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enrichment Worker Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Enrichment Worker</h2>
          </div>
          <button
            onClick={() => triggerMutation.mutate()}
            disabled={triggerMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {triggerMutation.isPending ? 'Triggering...' : 'Trigger Enrichment'}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-gray-900">{workerStatus?.queue.pending || 0}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Processing</p>
            <p className="text-2xl font-bold text-gray-900">{workerStatus?.queue.processing || 0}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Completed Today</p>
            <p className="text-2xl font-bold text-gray-900">{workerStatus?.queue.completedToday || 0}</p>
          </div>
          <button
            onClick={() => setShowFailedJobsModal(true)}
            className="bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors cursor-pointer text-left"
          >
            <p className="text-sm text-gray-600 mb-1">Failed Today</p>
            <p className="text-2xl font-bold text-gray-900">{workerStatus?.queue.failedToday || 0}</p>
            <p className="text-xs text-red-600 mt-1">Click to view errors →</p>
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm">
          <div
            className={`h-3 w-3 rounded-full ${
              workerStatus?.worker.isActive ? 'bg-green-500' : 'bg-gray-400'
            }`}
          ></div>
          <span className="text-gray-600">
            Worker status: {workerStatus?.worker.isActive ? 'Active' : 'Inactive'}
          </span>
          {workerStatus?.worker.lastProcessedAt && (
            <span className="text-gray-500 ml-2">
              Last processed: {new Date(workerStatus.worker.lastProcessedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Memory Types Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Memory Types</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Type
          </button>
        </div>

        <div className="space-y-3">
          {memoryTypes?.map((type) => (
            <div
              key={type.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              {editingType?.id === type.id ? (
                <form onSubmit={handleUpdateSubmit} className="flex-1 flex items-center gap-3">
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                    placeholder="📝"
                    required
                  />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded"
                    placeholder="Name"
                    required
                  />
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded"
                    placeholder="slug"
                    required
                  />
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingType(null);
                      resetForm();
                    }}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: type.color + '20',
                        color: type.color,
                      }}
                    >
                      <span className="mr-1">{type.icon}</span>
                      {type.name}
                    </div>
                    <span className="text-sm text-gray-500">({type.slug})</span>
                    {type.usageCount !== undefined && (
                      <span className="text-sm text-gray-400">{type.usageCount} uses</span>
                    )}
                    {!type.isActive && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">Inactive</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(type)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${type.name}"?`)) {
                          deleteMutation.mutate(type.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Words Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Words</h2>
          <span className="text-sm text-gray-500">{words?.length || 0} total words</span>
        </div>

        <div className="space-y-3">
          {words && words.length > 0 ? (
            words.map((word) => (
              <div
                key={word.id}
                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  console.log('Word clicked:', word.id);
                  setSelectedWordId(word.id);
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{word.word}</h3>
                    {word.phonetic && (
                      <span className="text-sm text-gray-500">{word.phonetic}</span>
                    )}
                    {word.partOfSpeech && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                        {word.partOfSpeech}
                      </span>
                    )}
                    {word.difficulty && (
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          word.difficulty === 'easy'
                            ? 'bg-green-100 text-green-700'
                            : word.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {word.difficulty}
                      </span>
                    )}
                  </div>

                  {word.description && (
                    <p className="text-sm text-gray-600 mb-2">{word.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Used by {word.usageCount || 0} memories</span>
                    {word.lastEnrichedAt && (
                      <span>
                        Last enriched: {new Date(word.lastEnrichedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Re-enrich "${word.word}" with OpenAI? This will update the word for all users.`)) {
                      enrichWordMutation.mutate(word.id);
                    }
                  }}
                  disabled={enrichWordMutation.isPending}
                  className="ml-4 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {enrichWordMutation.isPending ? 'Enriching...' : 'Enrich'}
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">No words yet. Create a word memory to get started!</p>
          )}
        </div>
      </div>

      {/* Create Memory Type Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Memory Type</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="📝"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="My Memory Type"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="my-type"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Lowercase, hyphens only</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Word Detail Modal */}
      {(() => {
        console.log('Modal check:', {
          selectedWordId,
          hasSelectedWord: !!selectedWord,
          isLoading: selectedWordLoading,
          error: selectedWordError
        });
        return selectedWordId;
      })() && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedWordId(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedWordLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">Loading word details...</div>
              </div>
            ) : selectedWordError ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <p className="text-red-600 mb-4">Failed to load word details</p>
                <p className="text-sm text-gray-500 mb-4">{String(selectedWordError)}</p>
                <button
                  onClick={() => setSelectedWordId(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            ) : selectedWord ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedWord.word}</h2>
                    {selectedWord.phonetic && (
                      <p className="text-gray-500 mt-1">{selectedWord.phonetic}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedWordId(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

            {/* Word Details */}
            <div className="space-y-4 mb-6">
              <div className="flex gap-2">
                {selectedWord.partOfSpeech && (
                  <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
                    {selectedWord.partOfSpeech}
                  </span>
                )}
                {selectedWord.difficulty && (
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${
                      selectedWord.difficulty === 'easy'
                        ? 'bg-green-100 text-green-700'
                        : selectedWord.difficulty === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {selectedWord.difficulty}
                  </span>
                )}
              </div>

              {selectedWord.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Definition</h3>
                  <p className="text-gray-700">{selectedWord.description}</p>
                </div>
              )}

              {selectedWord.etymology && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Etymology</h3>
                  <p className="text-gray-700">{selectedWord.etymology}</p>
                </div>
              )}

              {selectedWord.examples && selectedWord.examples.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Examples</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedWord.examples.map((example, idx) => (
                      <li key={idx} className="text-gray-700">{example}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedWord.synonyms && selectedWord.synonyms.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Synonyms</h3>
                  <p className="text-gray-700">{selectedWord.synonyms.join(', ')}</p>
                </div>
              )}

              {selectedWord.antonyms && selectedWord.antonyms.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Antonyms</h3>
                  <p className="text-gray-700">{selectedWord.antonyms.join(', ')}</p>
                </div>
              )}
            </div>

            {/* Linked Memories */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Linked Memories ({selectedWord.memories?.length || 0})
              </h3>

              {selectedWord.memories && selectedWord.memories.length > 0 ? (
                <div className="space-y-3">
                  {selectedWord.memories.map((memory) => (
                    <div
                      key={memory.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {memory.user.email}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(memory.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{memory.textContent}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No memories linked to this word yet.</p>
              )}
            </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Re-enrich "${selectedWord.word}" with OpenAI? This will update the word for all users.`)) {
                        enrichWordMutation.mutate(selectedWord.id);
                        setSelectedWordId(null);
                      }
                    }}
                    disabled={enrichWordMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {enrichWordMutation.isPending ? 'Enriching...' : 'Re-enrich with OpenAI'}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Users Modal */}
      {showUsersModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowUsersModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">All Users ({users?.length || 0})</h2>
              <button
                onClick={() => setShowUsersModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {loadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">Loading users...</div>
              </div>
            ) : users && users.length > 0 ? (
              <div className="space-y-3">
                {users.map((user: any) => (
                  <div key={user.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{user.email}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          user.tier === 'premium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.tier}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{user.memoryCount || 0} memories</span>
                      <span>Roles: {user.roles?.join(', ') || 'user'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No users found</p>
            )}
          </div>
        </div>
      )}

      {/* Memories By User Modal */}
      {showMemoriesModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowMemoriesModal(false);
            setMemoriesSearchTerm('');
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Memories By User</h2>
              <button
                onClick={() => {
                  setShowMemoriesModal(false);
                  setMemoriesSearchTerm('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by email or memory content..."
                value={memoriesSearchTerm}
                onChange={(e) => setMemoriesSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="overflow-y-auto flex-1">
              {loadingMemoriesByUser ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600">Loading memories...</div>
                </div>
              ) : memoriesByUser && memoriesByUser.length > 0 ? (
                <div className="space-y-6">
                  {memoriesByUser
                    .filter((userGroup: any) => {
                      if (!memoriesSearchTerm) return true;
                      const searchLower = memoriesSearchTerm.toLowerCase();
                      const emailMatch = userGroup.email.toLowerCase().includes(searchLower);
                      const memoryMatch = userGroup.memories.some((memory: any) =>
                        memory.textContent?.toLowerCase().includes(searchLower)
                      );
                      return emailMatch || memoryMatch;
                    })
                    .map((userGroup: any) => {
                      const filteredMemories = memoriesSearchTerm
                        ? userGroup.memories.filter((memory: any) =>
                            memory.textContent?.toLowerCase().includes(memoriesSearchTerm.toLowerCase())
                          )
                        : userGroup.memories;

                      if (memoriesSearchTerm && filteredMemories.length === 0 && !userGroup.email.toLowerCase().includes(memoriesSearchTerm.toLowerCase())) {
                        return null;
                      }

                      return (
                        <div key={userGroup.userId} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">{userGroup.email}</h3>
                            <span className="text-sm text-gray-500">
                              {memoriesSearchTerm && filteredMemories.length !== userGroup.memories.length
                                ? `${filteredMemories.length} / ${userGroup.memories.length} memories`
                                : `${userGroup.memories.length} memories`}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {(memoriesSearchTerm ? filteredMemories : filteredMemories.slice(0, 5)).map((memory: any) => (
                              <div key={memory.id} className="p-3 bg-gray-50 rounded">
                                <p className="text-sm text-gray-700 line-clamp-2">{memory.textContent}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(memory.createdAt).toLocaleDateString()} • {memory.state}
                                </p>
                              </div>
                            ))}
                            {!memoriesSearchTerm && userGroup.memories.length > 5 && (
                              <p className="text-sm text-gray-500 text-center py-2">
                                +{userGroup.memories.length - 5} more memories
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No memories found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Failed Jobs Modal */}
      {showFailedJobsModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowFailedJobsModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Failed Jobs ({failedJobs?.length || 0})</h2>
              <button
                onClick={() => setShowFailedJobsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {loadingFailedJobs ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">Loading failed jobs...</div>
              </div>
            ) : failedJobs && failedJobs.length > 0 ? (
              <div className="space-y-3">
                {failedJobs.map((job: any, idx: number) => (
                  <div key={idx} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">Memory ID: {job.memoryId}</h3>
                      <span className="text-sm text-gray-500">
                        {job.failedAt ? new Date(job.failedAt).toLocaleString() : 'Unknown time'}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-xs text-gray-600">Attempt: {job.attemptsMade || 0} / {job.maxRetries || 3}</span>
                    </div>
                    {job.error && (
                      <div className="bg-white border border-red-200 rounded p-3 mt-2">
                        <p className="text-sm font-medium text-red-900 mb-1">Error:</p>
                        <pre className="text-xs text-red-700 whitespace-pre-wrap">{job.error}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-green-600 mb-2">✓ No failed jobs today</div>
                <p className="text-sm text-gray-500">All enrichment jobs completed successfully</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
