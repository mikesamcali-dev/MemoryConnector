import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllUsers,
  updateUserEnabled,
  getSystemStats,
  getAICostTracking,
  getEnrichmentWorkerStatus,
  triggerEnrichment,
} from '../api/admin';
import {
  Users,
  ShieldCheck,
  ShieldX,
  Calendar,
  Activity,
  Loader,
  CheckCircle,
  XCircle,
  Database,
  DollarSign,
  Zap,
  Play,
  TrendingUp,
} from 'lucide-react';

export function AdminPanelPage() {
  const queryClient = useQueryClient();
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

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

  const handleToggleUser = (userId: string, currentEnabled: boolean) => {
    const action = currentEnabled ? 'disable' : 'enable';
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      toggleUserMutation.mutate({ userId, isEnabled: !currentEnabled });
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

        <div className="p-6">
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
            <div className="space-y-4">
              {users.map((user: any) => (
                <div
                  key={user.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {user.email}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {user.provider === 'google' ? '🔗 Google' : '🔐 Local'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tier</p>
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.tier === 'premium'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.tier}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      {user.isEnabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3" />
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3" />
                          Disabled
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Memories</p>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                        <Activity className="h-4 w-4 text-gray-400" />
                        {user.memoryCount}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Created</p>
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Roles</p>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role: string) => (
                        <span
                          key={role}
                          className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleUser(user.id, user.isEnabled)}
                    disabled={loadingUserId === user.id}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                      user.isEnabled
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loadingUserId === user.id ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : user.isEnabled ? (
                      <>
                        <ShieldX className="h-5 w-5" />
                        Disable User
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-5 w-5" />
                        Enable User
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
