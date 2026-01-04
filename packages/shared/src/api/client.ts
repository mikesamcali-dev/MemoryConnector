/**
 * Shared API client logic
 * Can be used by both web and mobile apps
 */

export interface ApiConfig {
  baseUrl: string;
  getAccessToken: () => Promise<string | null>;
  setAccessToken: (token: string) => Promise<void>;
  removeAccessToken: () => Promise<void>;
  onUnauthorized?: () => void;
}

export class ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.config.getAccessToken();
    const headers = new Headers(options.headers);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${this.config.baseUrl}${url}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401) {
      // Try to refresh token
      const refreshResponse = await fetch(`${this.config.baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        const { accessToken } = await refreshResponse.json();
        await this.config.setAccessToken(accessToken);
        headers.set('Authorization', `Bearer ${accessToken}`);
        return fetch(`${this.config.baseUrl}${url}`, {
          ...options,
          headers,
          credentials: 'include',
        });
      }

      // Refresh failed
      await this.config.removeAccessToken();
      if (this.config.onUnauthorized) {
        this.config.onUnauthorized();
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      const errorWithStatus = new Error(error.message || 'Request failed') as Error & { status: number };
      errorWithStatus.status = response.status;
      throw errorWithStatus;
    }

    return response;
  }

  async get<T>(url: string): Promise<T> {
    const response = await this.fetch(url);
    return response.json();
  }

  async post<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    const response = await this.fetch(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
    return response.json();
  }

  async put<T>(url: string, data: any): Promise<T> {
    const response = await this.fetch(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async delete(url: string): Promise<void> {
    await this.fetch(url, {
      method: 'DELETE',
    });
  }
}
