const API_BASE = '/api/v1';

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('accessToken');
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
    const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshResponse.ok) {
      const { accessToken } = await refreshResponse.json();
      localStorage.setItem('accessToken', accessToken);
      headers.set('Authorization', `Bearer ${accessToken}`);
      return fetch(`${API_BASE}${url}`, { ...options, headers, credentials: 'include' });
    }
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response;
}

export interface ReminderPreferences {
  id: string;
  userId: string;
  firstReminderMinutes: number;
  secondReminderMinutes: number;
  thirdReminderMinutes: number;
  remindersEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getReminderPreferences(): Promise<ReminderPreferences> {
  const response = await fetchWithAuth('/user-preferences/reminders');
  return response.json();
}

export async function updateReminderPreferences(data: {
  firstReminderMinutes?: number;
  secondReminderMinutes?: number;
  thirdReminderMinutes?: number;
  remindersEnabled?: boolean;
}): Promise<ReminderPreferences> {
  const response = await fetchWithAuth('/user-preferences/reminders', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

// Helper to convert minutes to friendly display
export function minutesToDisplay(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (minutes < 1440) { // Less than a day
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (minutes < 10080) { // Less than a week
    const days = Math.floor(minutes / 1440);
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else {
    const weeks = Math.floor(minutes / 10080);
    return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  }
}

// Helper to convert friendly input to minutes
export function parseToMinutes(value: number, unit: 'minutes' | 'hours' | 'days' | 'weeks'): number {
  switch (unit) {
    case 'minutes': return value;
    case 'hours': return value * 60;
    case 'days': return value * 1440;
    case 'weeks': return value * 10080;
  }
}
