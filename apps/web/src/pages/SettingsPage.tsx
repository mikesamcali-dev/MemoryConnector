import { useAuth } from '../contexts/AuthContext';

export function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Account</h2>
          <p className="text-sm text-gray-600">Email: {user?.email}</p>
          <p className="text-sm text-gray-600">Tier: {user?.tier}</p>
        </div>

        <div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

