import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('No authentication token received');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    // Login with the token from OAuth callback
    loginWithToken(token).catch((err) => {
      console.error('OAuth login error:', err);
      setError(err.message || 'Failed to complete authentication');
      setTimeout(() => navigate('/login'), 2000);
    });
  }, [searchParams, loginWithToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center px-4">
        {error ? (
          <div>
            <div className="text-red-600 text-xl font-semibold mb-4">Authentication Failed</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </div>
        ) : (
          <div>
            <div className="text-gray-900 text-xl font-semibold mb-4">Completing Sign In...</div>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
