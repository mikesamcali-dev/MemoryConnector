const API_BASE = '/api/v1';

async function fetchWithAuth(url: string, options: RequestInit = {}, token?: string): Promise<Response> {
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    // Try to refresh token
    try {
      const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshResponse.ok) {
        const { accessToken } = await refreshResponse.json();
        localStorage.setItem('accessToken', accessToken);
        // Retry original request
        headers.set('Authorization', `Bearer ${accessToken}`);
        return fetch(`${API_BASE}${url}`, { ...options, headers, credentials: 'include' });
      }
    } catch (error) {
      // Refresh failed, redirect to login
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      throw error;
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response;
}

export async function login(email: string, password: string) {
  const response = await fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function signup(email: string, password: string) {
  const response = await fetchWithAuth('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function logout(token: string) {
  await fetchWithAuth('/auth/logout', { method: 'POST' }, token);
}

export async function getMe(token: string) {
  const response = await fetchWithAuth('/auth/me', {}, token);
  return response.json();
}
