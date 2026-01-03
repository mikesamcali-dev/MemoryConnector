import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/auth';

interface User {
  id: string;
  email: string;
  tier: 'free' | 'premium';
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for stored token on mount
    const token = localStorage.getItem('accessToken');
    if (token) {
      setAccessToken(token);
      // Verify token by fetching user
      api.getMe(token)
        .then((userData) => {
          // ADMIN CHECK - Verify user has admin role
          if (!userData.roles.includes('admin')) {
            localStorage.removeItem('accessToken');
            setAccessToken(null);
            navigate('/login');
            return;
          }
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          setAccessToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [navigate]);

  const login = async (email: string, password: string) => {
    const result = await api.login(email, password);
    setAccessToken(result.accessToken);
    localStorage.setItem('accessToken', result.accessToken);

    const userData = await api.getMe(result.accessToken);

    // ADMIN CHECK - Verify user has admin role
    if (!userData.roles.includes('admin')) {
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      throw new Error('Access denied. Admin privileges required.');
    }

    setUser(userData);
    navigate('/dashboard');
  };

  const logout = async () => {
    if (accessToken) {
      try {
        await api.logout(accessToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
