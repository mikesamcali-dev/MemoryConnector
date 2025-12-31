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
    // Try to refresh
    const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshResponse.ok) {
      const { accessToken } = await refreshResponse.json();
      localStorage.setItem('accessToken', accessToken);

      // Retry original request
      headers.set('Authorization', `Bearer ${accessToken}`);
      return fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    } else {
      // Refresh failed, redirect to login
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      throw new Error('Authentication failed');
    }
  }

  return response;
}

export interface AuditTrailEvent {
  id: string;
  tenantId: string | null;
  userId: string | null;
  actorType: string;
  actorEmail: string | null;
  impersonatorId: string | null;
  eventType: string;
  action: string;
  entityName: string | null;
  entityId: string | null;
  createdAt: string;
  durationMs: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  deviceId: string | null;
  geoCountry: string | null;
  geoCity: string | null;
  requestId: string | null;
  sessionId: string | null;
  correlationId: string | null;
  traceId: string | null;
  method: string | null;
  url: string | null;
  success: boolean;
  statusCode: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  exceptionType: string | null;
  beforeJson: any;
  afterJson: any;
  diffJson: any;
  requestJson: any;
  responseJson: any;
  loggingLevel: string;
  redactedFields: string[];
  truncatedFields: string[];
  dataHash: string | null;
  tags: any;
  notes: string | null;
  msg: string | null;
}

export interface AuditTrailFilters {
  userId?: string;
  eventType?: string;
  action?: string;
  entityName?: string;
  entityId?: string;
  success?: boolean;
  actorType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuditTrailResponse {
  events: AuditTrailEvent[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuditStats {
  total: number;
  totalSuccess: number;
  totalFailure: number;
  successRate: number;
  last24Hours: number;
  topEventTypes: Array<{ eventType: string; count: number }>;
  topUsers: Array<{ userId: string; actorEmail: string; count: number }>;
}

export async function getAuditTrail(filters: AuditTrailFilters): Promise<AuditTrailResponse> {
  const params = new URLSearchParams();

  if (filters.userId) params.append('userId', filters.userId);
  if (filters.eventType) params.append('eventType', filters.eventType);
  if (filters.action) params.append('action', filters.action);
  if (filters.entityName) params.append('entityName', filters.entityName);
  if (filters.entityId) params.append('entityId', filters.entityId);
  if (filters.success !== undefined) params.append('success', String(filters.success));
  if (filters.actorType) params.append('actorType', filters.actorType);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.search) params.append('search', filters.search);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  const response = await fetchWithAuth(`/audit-trail?${params.toString()}`);
  return response.json();
}

export async function getAuditStats(): Promise<AuditStats> {
  const response = await fetchWithAuth('/audit-trail/stats');
  return response.json();
}

export async function getAuditEventTypes(): Promise<Array<{ eventType: string; count: number }>> {
  const response = await fetchWithAuth('/audit-trail/event-types');
  return response.json();
}

export async function getAuditActions(): Promise<Array<{ action: string; count: number }>> {
  const response = await fetchWithAuth('/audit-trail/actions');
  return response.json();
}

export async function getAuditEntityNames(): Promise<Array<{ entityName: string; count: number }>> {
  const response = await fetchWithAuth('/audit-trail/entity-names');
  return response.json();
}

export async function getAuditEventById(id: string): Promise<AuditTrailEvent> {
  const response = await fetchWithAuth(`/audit-trail/${id}`);
  return response.json();
}

export async function getEntityTimeline(entityName: string, entityId: string): Promise<AuditTrailEvent[]> {
  const response = await fetchWithAuth(`/audit-trail/entity/${entityName}/${entityId}`);
  return response.json();
}

export async function getUserActivity(userId: string, days = 7): Promise<AuditTrailEvent[]> {
  const response = await fetchWithAuth(`/audit-trail/user/${userId}?days=${days}`);
  return response.json();
}
