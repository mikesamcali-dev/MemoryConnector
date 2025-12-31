import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditTrailService } from '../audit-trail.service';

@Injectable()
export class AuditLoggingInterceptor implements NestInterceptor {
  constructor(private auditTrailService: AuditTrailService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    // Only log certain paths
    if (!this.shouldLog(request)) {
      return next.handle();
    }

    const auditContext = {
      userId: request.user?.id || null,
      actorType: this.getActorType(request),
      actorEmail: request.user?.email || null,
      ipAddress: request.ip || request.connection?.remoteAddress,
      userAgent: request.headers['user-agent'],
      requestId: request.id || this.generateRequestId(),
      sessionId: request.session?.id || null,
    };

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - startTime;
        const statusCode = context.switchToHttp().getResponse().statusCode;

        // Log asynchronously (don't block response)
        this.logAudit({
          ...auditContext,
          eventType: this.getEventType(request),
          action: this.getAction(request.method),
          entityName: this.getEntityName(request),
          entityId: this.getEntityId(request, response),
          createdAt: new Date(),
          durationMs: duration,
          success: true,
          statusCode,
          method: request.method,
          url: request.path || request.url,
          msg: `Request completed`,
          requestJson: this.sanitizeRequest(request),
          responseJson: this.sanitizeResponse(response),
          loggingLevel: 'STANDARD',
          notes: this.generateNotes(request, response),
        }).catch((err) => {
          console.error('Failed to write audit log:', err);
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Log error asynchronously
        this.logAudit({
          ...auditContext,
          eventType: this.getEventType(request),
          action: this.getAction(request.method),
          entityName: this.getEntityName(request),
          createdAt: new Date(),
          durationMs: duration,
          success: false,
          statusCode,
          method: request.method,
          url: request.path || request.url,
          msg: `Request failed: ${error.message || 'Unknown error'}`,
          errorCode: error.code || 'INTERNAL_ERROR',
          errorMessage: error.message?.substring(0, 1000),
          exceptionType: error.constructor?.name,
          requestJson: this.sanitizeRequest(request),
          loggingLevel: 'STANDARD',
        }).catch((err) => {
          console.error('Failed to write audit log:', err);
        });

        return throwError(() => error);
      })
    );
  }

  private async logAudit(data: any): Promise<void> {
    try {
      await this.auditTrailService.create(data);
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  private shouldLog(request: any): boolean {
    const path = request.path || request.url;

    // Skip health checks, metrics
    if (['/health', '/metrics', '/api/v1/health', '/api/v1/metrics'].some(p => path.includes(p))) {
      return false;
    }

    // Skip audit trail itself to avoid recursive logging
    if (path.includes('/audit-trail')) {
      return false;
    }

    // Log all other API requests
    return true;
  }

  private getEventType(request: any): string {
    const path = request.path || request.url;

    if (path.includes('/memories')) {
      if (request.method === 'POST') return 'MEMORY_CREATE';
      if (request.method === 'PUT' || request.method === 'PATCH') return 'MEMORY_UPDATE';
      if (request.method === 'DELETE') return 'MEMORY_DELETE';
      return 'MEMORY_READ';
    }

    if (path.includes('/search')) return 'SEARCH';
    if (path.includes('/auth/login')) return 'AUTH_LOGIN';
    if (path.includes('/auth/signup')) return 'AUTH_SIGNUP';
    if (path.includes('/auth/logout')) return 'AUTH_LOGOUT';
    if (path.includes('/admin/export')) return 'ADMIN_EXPORT';
    if (path.includes('/admin/')) return 'ADMIN_ACTION';
    if (path.includes('/people')) return 'ENTITY_PERSON';
    if (path.includes('/locations')) return 'ENTITY_LOCATION';
    if (path.includes('/events')) return 'ENTITY_EVENT';
    if (path.includes('/words')) return 'ENTITY_WORD';

    return 'API_REQUEST';
  }

  private getAction(method: string): string {
    const actionMap: Record<string, string> = {
      POST: 'CREATE',
      GET: 'READ',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return actionMap[method] || 'REQUEST';
  }

  private getEntityName(request: any): string | null {
    const path = request.path || request.url;

    if (path.includes('/memories')) return 'memories';
    if (path.includes('/users')) return 'users';
    if (path.includes('/people')) return 'people';
    if (path.includes('/locations')) return 'locations';
    if (path.includes('/events')) return 'events';
    if (path.includes('/words')) return 'words';
    if (path.includes('/reminders')) return 'reminders';

    return null;
  }

  private getEntityId(request: any, response: any): string | null {
    // Try to extract from response
    if (response?.id) return response.id;

    // Try to extract from URL params
    const path = request.path || request.url;
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = path.match(uuidRegex);
    return match ? match[0] : null;
  }

  private getActorType(request: any): string {
    if (!request.user) return 'ANONYMOUS';
    if (request.user.roles?.includes('admin')) return 'ADMIN';
    return 'USER';
  }

  private sanitizeRequest(request: any): any {
    const { body, query, params } = request;
    return {
      body: this.redactSensitiveData(body),
      query,
      params,
    };
  }

  private sanitizeResponse(response: any): any {
    if (!response) return null;

    // Don't log entire lists, just metadata
    if (Array.isArray(response)) {
      return { resultCount: response.length };
    }

    // Limit response size - handle circular references
    try {
      const str = JSON.stringify(response);
      if (str.length > 5000) {
        return { truncated: true, size: str.length };
      }
      return this.redactSensitiveData(response);
    } catch (error) {
      // Handle circular reference or other serialization errors
      if (error instanceof TypeError && error.message.includes('circular')) {
        return { error: 'Circular reference detected - response not logged' };
      }
      return { error: 'Failed to serialize response' };
    }
  }

  private redactSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const redacted = { ...data };
    const sensitiveFields = [
      'password',
      'passwordHash',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
    ];

    for (const field of sensitiveFields) {
      if (field in redacted) {
        redacted[field] = '[REDACTED]';
      }
    }

    return redacted;
  }

  private generateNotes(request: any, response: any): string | null {
    const action = this.getAction(request.method);
    const entityName = this.getEntityName(request);

    if (!entityName || !response) return null;

    try {
      // Extract human-readable identifier based on entity type
      let identifier = null;

      switch (entityName) {
        case 'memories':
          identifier = response.title || response.textContent?.substring(0, 50);
          break;
        case 'people':
          identifier = response.displayName || response.name;
          break;
        case 'locations':
          identifier = response.name || response.address;
          break;
        case 'events':
          identifier = response.title || response.name;
          break;
        case 'words':
          identifier = response.word;
          break;
        case 'users':
          identifier = response.email;
          break;
        case 'reminders':
          identifier = response.message?.substring(0, 50);
          break;
        default:
          identifier = response.id || response.name || response.title;
      }

      if (!identifier) return null;

      // Truncate if too long
      if (identifier.length > 100) {
        identifier = identifier.substring(0, 97) + '...';
      }

      // Generate descriptive note
      const actionVerb = {
        'CREATE': 'Created',
        'UPDATE': 'Updated',
        'DELETE': 'Deleted',
        'READ': 'Viewed',
      }[action] || action;

      return `${actionVerb} ${entityName}: "${identifier}"`;
    } catch (error) {
      return null;
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
