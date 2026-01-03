import { useQuery } from '@tanstack/react-query';
import { getSystemStats } from '../api/admin';
import { Activity, Users, Database, TrendingUp, Calendar } from 'lucide-react';

export function SystemStatsPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: getSystemStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">Error loading stats: {error.message}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">No stats available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Statistics</h1>
            <p className="text-sm text-gray-500">Real-time system metrics and analytics</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date(stats.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.users.toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Memories */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Memories</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.memories.toLocaleString()}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <Database className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Memories Today */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Memories Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.memoriesToday.toLocaleString()}</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Total Embeddings */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Embeddings</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.embeddings.toLocaleString()}</p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Calculated Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Average Memories per User */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Avg Memories per User</h3>
          <p className="text-2xl font-bold text-blue-900">
            {stats.users > 0 ? (stats.memories / stats.users).toFixed(1) : '0'}
          </p>
        </div>

        {/* Embedding Coverage */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-green-900 mb-2">Embedding Coverage</h3>
          <p className="text-2xl font-bold text-green-900">
            {stats.memories > 0 ? ((stats.embeddings / stats.memories) * 100).toFixed(1) : '0'}%
          </p>
          <p className="text-xs text-green-700 mt-1">
            {stats.embeddings} of {stats.memories} memories
          </p>
        </div>

        {/* Today's Activity Rate */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-purple-900 mb-2">Today's Activity</h3>
          <p className="text-2xl font-bold text-purple-900">
            {stats.users > 0 ? ((stats.memoriesToday / stats.users) * 100).toFixed(1) : '0'}%
          </p>
          <p className="text-xs text-purple-700 mt-1">
            {stats.memoriesToday} memories from {stats.users} users
          </p>
        </div>
      </div>

      {/* System Health Indicator */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
        <div className="space-y-4">
          {/* Database Status */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-gray-900">Database</span>
            </div>
            <span className="text-sm text-green-700 font-medium">Operational</span>
          </div>

          {/* Embeddings System */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-gray-900">Embeddings System</span>
            </div>
            <span className="text-sm text-green-700 font-medium">Operational</span>
          </div>

          {/* API Status */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-gray-900">API Service</span>
            </div>
            <span className="text-sm text-green-700 font-medium">Operational</span>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">About Statistics</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Statistics are updated in real-time every 30 seconds</li>
          <li>• Embedding coverage shows the percentage of memories with vector embeddings</li>
          <li>• Today's metrics reset at midnight server time</li>
        </ul>
      </div>
    </div>
  );
}
