import { useState } from 'react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import {
  getAllUsers,
  updateUserEnabled,
  updateUserTier,
  getSystemStats,
  getAICostTracking,
  getEnrichmentWorkerStatus,
  triggerEnrichment,
  getAllWords,
  createWord,
  updateWord,
  deleteWord,
  enrichWord,
} from '../api/admin';
import {
  Users,
  ShieldCheck,
  ShieldX,
  Activity,
  Loader,
  CheckCircle,
  XCircle,
  Database,
  DollarSign,
  Zap,
  Play,
  TrendingUp,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { WordEditModal } from '../components/admin/WordEditModal';

import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
export function AdminPanelPage() {
  const queryClient = useQueryClient();
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<any | null>(null);

  // Fetch system stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getSystemStats,
  });

  // Fetch AI cost tracking
  const { data: aiCosts } = useQuery({
    queryKey: ['admin-ai-costs'],
    queryFn: getAICostTracking,
  });

  // Fetch enrichment worker status
  const { data: enrichmentWorker } = useQuery({
    queryKey: ['admin-enrichment-worker'],
    queryFn: getEnrichmentWorkerStatus,
  });

  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAllUsers,
  });

  // Fetch all words
  const { data: words, isLoading: wordsLoading } = useQuery({
    queryKey: ['admin-words'],
    queryFn: getAllWords,
  });

  // Mutation to trigger enrichment
  const triggerEnrichmentMutation = useMutation({
    mutationFn: triggerEnrichment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enrichment-worker'] });
    },
  });

  // Mutation to toggle user enabled/disabled
  const toggleUserMutation = useMutation({
    mutationFn: ({ userId, isEnabled }: { userId: string; isEnabled: boolean }) =>
      updateUserEnabled(userId, isEnabled),
    onMutate: ({ userId }) => {
      setLoadingUserId(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onSettled: () => {
      setLoadingUserId(null);
    },
  });

  // Mutation to update user tier
  const updateTierMutation = useMutation({
    mutationFn: ({ userId, tier }: { userId: string; tier: 'free' | 'premium' }) =>
      updateUserTier(userId, tier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  // Word mutations
  const createWordMutation = useMutation({
    mutationFn: (wordText: string) => createWord(wordText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-words'] });
      setIsWordModalOpen(false);
      setEditingWord(null);
      alert('Word created and enriched successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to create word: ${error.message}`);
    },
  });

  const updateWordMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateWord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-words'] });
      setIsWordModalOpen(false);
      setEditingWord(null);
      alert('Word updated successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to update word: ${error.message}`);
    },
  });

  const enrichWordMutation = useMutation({
    mutationFn: (id: string) => enrichWord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-words'] });
      alert('Word re-enriched successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to re-enrich word: ${error.message}`);
    },
  });

  const deleteWordMutation = useMutation({
    mutationFn: (id: string) => deleteWord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-words'] });
      alert('Word deleted successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to delete word: ${error.message}`);
    },
  });

  const handleToggleUser = (userId: string, currentEnabled: boolean) => {
    const action = currentEnabled ? 'disable' : 'enable';
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      toggleUserMutation.mutate({ userId, isEnabled: !currentEnabled });
    }
  };

  const handleTierChange = (userId: string, newTier: 'free' | 'premium') => {
    updateTierMutation.mutate({ userId, tier: newTier });
  };

  const handleCreateWord = () => {
    setEditingWord(null);
    setIsWordModalOpen(true);
  };

  const handleEditWord = (word: any) => {
    setEditingWord(word);
    setIsWordModalOpen(true);
  };

  const handleSaveWord = (data: any) => {
    if (editingWord) {
      // Update existing word
      updateWordMutation.mutate({ id: editingWord.id, data });
    } else {
      // Create new word
      if (data.word) {
        createWordMutation.mutate(data.word);
      }
    }
  };

  const handleDeleteWord = (id: string, word: string) => {
    if (confirm(`Are you sure you want to delete "${word}"? This will remove it from all memories.`)) {
      deleteWordMutation.mutate(id);
    }
  };

  const handleEnrichWord = (id: string, word: string) => {
    if (confirm(`Re-enrich "${word}" with OpenAI? This will update the definition, examples, and other details.`)) {
      enrichWordMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Monitor system performance and manage users</p>
      </div>

      {/* System Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.users || 0}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Memories</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.memories || 0}</p>
            </div>
            <Database className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.memoriesToday || 0}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Embeddings</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.embeddings || 0}</p>
            </div>
            <Zap className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* AI & Enrichment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* AI Cost Tracking */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">AI Cost Tracking</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Daily Spend</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${((aiCosts?.dailySpend?.totalCents || 0) / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Budget Used</span>
                <span className="text-lg font-semibold text-gray-900">
                  {aiCosts?.dailySpend?.percentUsed?.toFixed(1) || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Circuit State</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    aiCosts?.dailySpend?.circuitState === 'CLOSED'
                      ? 'bg-green-100 text-green-800'
                      : aiCosts?.dailySpend?.circuitState === 'QUEUE_ONLY'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {aiCosts?.dailySpend?.circuitState || 'UNKNOWN'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Operations</span>
                <span className="text-lg font-semibold text-gray-900">
                  {aiCosts?.dailySpend?.operationCount || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enrichment Worker */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Enrichment Worker</h2>
              </div>
              <button
                onClick={() => triggerEnrichmentMutation.mutate()}
                disabled={triggerEnrichmentMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {triggerEnrichmentMutation.isPending ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Triggering...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Trigger
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Worker Status</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    enrichmentWorker?.worker?.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {enrichmentWorker?.worker?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <span className="text-lg font-semibold text-gray-900">
                  {enrichmentWorker?.queue?.pending || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Processing</span>
                <span className="text-lg font-semibold text-gray-900">
                  {enrichmentWorker?.queue?.processing || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed Today</span>
                <span className="text-lg font-semibold text-green-600">
                  {enrichmentWorker?.queue?.completedToday || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Failed Today</span>
                <span className="text-lg font-semibold text-red-600">
                  {enrichmentWorker?.queue?.failedToday || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Manage user accounts and permissions
          </p>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : !users || users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No users found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memories</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {user.provider === 'google' ? '🔗 Google' : '🔐 Local'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.tier}
                        onChange={(e) => handleTierChange(user.id, e.target.value as 'free' | 'premium')}
                        className={`text-xs font-semibold rounded-full px-3 py-1 border-0 focus:ring-2 focus:ring-blue-500 ${
                          user.tier === 'premium'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isEnabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3" />
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3" />
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.memoryCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role: string) => (
                          <span
                            key={role}
                            className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleToggleUser(user.id, user.isEnabled)}
                        disabled={loadingUserId === user.id}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          user.isEnabled
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } disabled:opacity-50`}
                      >
                        {loadingUserId === user.id ? (
                          <Loader className="h-3 w-3 animate-spin" />
                        ) : user.isEnabled ? (
                          <><ShieldX className="h-3 w-3" /> Disable</>
                        ) : (
                          <><ShieldCheck className="h-3 w-3" /> Enable</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Words Management Section */}
      <div className="mt-6 bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-green-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Words Management</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Create, edit, and manage vocabulary words
                </p>
              </div>
            </div>
            <button
              onClick={handleCreateWord}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Word
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {wordsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : !words || words.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No words found</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Total words: <span className="font-semibold">{words.length}</span>
                </p>
              </div>
              <div className="space-y-4">
                {words.map((word: any) => (
                  <div
                    key={word.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{word.word}</h3>
                        {word.phonetic && (
                          <p className="text-sm text-gray-500">{word.phonetic}</p>
                        )}
                        {word.description && (
                          <p className="text-sm text-gray-700 mt-1">{word.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {word.partOfSpeech && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {word.partOfSpeech}
                          </span>
                        )}
                        {word.difficulty && (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            word.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            word.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {word.difficulty}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Database className="h-4 w-4" />
                        <span>{word.memoryCount} {word.memoryCount === 1 ? 'memory' : 'memories'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{word.userCount} {word.userCount === 1 ? 'user' : 'users'}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Created {new Date(word.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {word.users && word.users.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Used by:</p>
                        <div className="flex flex-wrap gap-2">
                          {word.users.map((user: any) => (
                            <div
                              key={user.userId}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              <span>{user.email}</span>
                              <span className="text-gray-500">({user.count})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                      <button
                        onClick={() => handleEditWord(word)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleEnrichWord(word.id, word.word)}
                        disabled={enrichWordMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Re-enrich
                      </button>
                      <button
                        onClick={() => handleDeleteWord(word.id, word.word)}
                        disabled={deleteWordMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Word Edit Modal */}
      <WordEditModal
        word={editingWord}
        isOpen={isWordModalOpen}
        onClose={() => {
          setIsWordModalOpen(false);
          setEditingWord(null);
        }}
        onSave={handleSaveWord}
        isSaving={createWordMutation.isPending || updateWordMutation.isPending}
      />
      {/* Help Popup */}
      <HelpPopup
        pageKey="admin"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}