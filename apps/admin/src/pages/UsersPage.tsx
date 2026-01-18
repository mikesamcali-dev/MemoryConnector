import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUserRoles, updateUserTier, deleteUser, resetUserOnboarding } from '../api/admin';
import { Users, Shield, Trash2, Crown, User as UserIcon, Calendar, Database, RefreshCw } from 'lucide-react';

interface User {
  id: string;
  email: string;
  tier: 'free' | 'premium';
  roles: string[];
  provider: string;
  createdAt: string;
  updatedAt: string;
  memoryCount: number;
}

export function UsersPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token');
      return getUsers(token);
    },
  });

  const updateRolesMutation = useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: string[] }) => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token');
      return updateUserRoles(userId, roles, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const updateTierMutation = useMutation({
    mutationFn: async ({ userId, tier }: { userId: string; tier: 'free' | 'premium' }) => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token');
      return updateUserTier(userId, tier, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token');
      return deleteUser(userId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowDeleteConfirm(null);
    },
  });

  const resetOnboardingMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token');
      return resetUserOnboarding(userId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowResetConfirm(null);
    },
  });

  const toggleRole = (user: User, role: string) => {
    const newRoles = user.roles.includes(role)
      ? user.roles.filter(r => r !== role)
      : [...user.roles, role];

    updateRolesMutation.mutate({ userId: user.id, roles: newRoles });
  };

  const handleTierChange = (user: User, tier: 'free' | 'premium') => {
    updateTierMutation.mutate({ userId: user.id, tier });
  };

  const handleDelete = (userId: string) => {
    deleteMutation.mutate(userId);
  };

  const handleResetOnboarding = (userId: string) => {
    resetOnboardingMutation.mutate(userId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">Error loading users: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500">Manage user accounts, roles, and permissions</p>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Total Users: <span className="font-semibold">{users.length}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Users</p>
              <p className="text-2xl font-bold text-blue-900">{users.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Admin Users</p>
              <p className="text-2xl font-bold text-purple-900">
                {users.filter(u => u.roles.includes('admin')).length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Premium Users</p>
              <p className="text-2xl font-bold text-green-900">
                {users.filter(u => u.tier === 'premium').length}
              </p>
            </div>
            <Crown className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Memories
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        <div className="text-xs text-gray-500">{user.provider}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.tier}
                      onChange={(e) => handleTierChange(user, e.target.value as 'free' | 'premium')}
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        user.tier === 'premium'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      } border-none cursor-pointer`}
                    >
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => toggleRole(user, 'admin')}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          user.roles.includes('admin')
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                        }`}
                        title={user.roles.includes('admin') ? 'Remove admin role' : 'Add admin role'}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </button>
                      {user.roles.includes('user') && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          User
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Database className="h-4 w-4 text-gray-400 mr-1" />
                      {user.memoryCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-3">
                      {showResetConfirm === user.id ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleResetOnboarding(user.id)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                            disabled={resetOnboardingMutation.isPending}
                          >
                            Confirm Reset
                          </button>
                          <button
                            onClick={() => setShowResetConfirm(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowResetConfirm(user.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Reset onboarding - user will be prompted to update their memory profile"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}

                      {showDeleteConfirm === user.id ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                            disabled={deleteMutation.isPending}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDeleteConfirm(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">User Management Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Click tier dropdown to upgrade/downgrade user subscription</li>
          <li>• Click "Admin" badge to toggle admin permissions</li>
          <li>• Click refresh icon to reset user onboarding (prompts user to update their memory profile)</li>
          <li>• Deleting a user will permanently remove all their memories</li>
          <li>• Admin role allows access to this admin panel</li>
        </ul>
      </div>
    </div>
  );
}
