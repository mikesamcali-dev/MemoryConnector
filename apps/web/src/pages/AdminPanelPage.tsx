import { useState } from 'react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllUsers,
  updateUserEnabled,
  updateUserTier,
  resetUserOnboarding,
  getSystemStats,
  getAICostTracking,
  getEnrichmentWorkerStatus,
  triggerEnrichment,
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
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AdminPanelPage() {
  const helpPopup = useHelpPopup('admin');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [resetUserId, setResetUserId] = useState<string | null>(null);

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

  // Mutation to reset user onboarding
  const resetOnboardingMutation = useMutation({
    mutationFn: (userId: string) => resetUserOnboarding(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setResetUserId(null);
      alert('User onboarding has been reset. They will be prompted to update their profile on next login.');
    },
    onError: (error: any) => {
      alert(`Failed to reset onboarding: ${error.message}`);
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

  const handleResetOnboarding = (userId: string) => {
    if (confirm('Reset user onboarding? The user will be prompted to update their memory profile on next login.')) {
      setResetUserId(userId);
      resetOnboardingMutation.mutate(userId);
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResetOnboarding(user.id)}
                          disabled={resetOnboardingMutation.isPending && resetUserId === user.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                          title="Reset onboarding - user will update their memory profile on next login"
                        >
                          {resetOnboardingMutation.isPending && resetUserId === user.id ? (
                            <Loader className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                        </button>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Words Management Link */}
      <div className="mt-6 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
        <button
          onClick={() => navigate('/app/admin/words')}
          className="w-full p-6 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Words Management</h2>
                <p className="text-sm text-gray-600">
                  Create, edit, and manage vocabulary words
                </p>
              </div>
            </div>
            <div className="text-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>
      </div>

      {/* Help Popup */}
      <HelpPopup
        pageKey="admin"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}