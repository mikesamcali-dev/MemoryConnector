import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getAuditTrail,
  getAuditStats,
  getAuditEventTypes,
  getAuditActions,
  getAuditEntityNames,
  AuditTrailEvent,
  AuditTrailFilters,
} from '../api/auditTrail';
import {
  ArrowLeft,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Calendar,
  User,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AuditTrailPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<AuditTrailFilters>({
    page: 1,
    limit: 50,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AuditTrailEvent | null>(null);

  // Fetch audit trail with filters
  const { data: auditData, isLoading, refetch } = useQuery({
    queryKey: ['audit-trail', filters],
    queryFn: () => getAuditTrail(filters),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: getAuditStats,
  });

  // Fetch filter options
  const { data: eventTypes } = useQuery({
    queryKey: ['audit-event-types'],
    queryFn: getAuditEventTypes,
  });

  const { data: actions } = useQuery({
    queryKey: ['audit-actions'],
    queryFn: getAuditActions,
  });

  const { data: entityNames } = useQuery({
    queryKey: ['audit-entity-names'],
    queryFn: getAuditEntityNames,
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 50,
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const hasActiveFilters = Object.keys(filters).some(
    (key) => key !== 'page' && key !== 'limit' && filters[key as keyof AuditTrailFilters]
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/app/admin')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Dashboard
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive event logging and system activity monitoring
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-600 font-medium">Total Events</div>
                <div className="text-2xl font-bold text-blue-900">{stats.total.toLocaleString()}</div>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-600 font-medium">Success Rate</div>
                <div className="text-2xl font-bold text-green-900">
                  {stats.successRate.toFixed(1)}%
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-red-600 font-medium">Failed Events</div>
                <div className="text-2xl font-bold text-red-900">
                  {stats.totalFailure.toLocaleString()}
                </div>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-purple-600 font-medium">Last 24 Hours</div>
                <div className="text-2xl font-bold text-purple-900">
                  {stats.last24Hours.toLocaleString()}
                </div>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by email, IP address, error code, request ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="h-5 w-5" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                Active
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <X className="h-5 w-5" />
              Clear
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                value={filters.eventType || ''}
                onChange={(e) => handleFilterChange('eventType', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {eventTypes?.map((type) => (
                  <option key={type.eventType} value={type.eventType}>
                    {type.eventType} ({type.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Action */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                value={filters.action || ''}
                onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                {actions?.map((action) => (
                  <option key={action.action} value={action.action}>
                    {action.action} ({action.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Entity Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity
              </label>
              <select
                value={filters.entityName || ''}
                onChange={(e) => handleFilterChange('entityName', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Entities</option>
                {entityNames?.map((entity) => (
                  <option key={entity.entityName} value={entity.entityName}>
                    {entity.entityName} ({entity.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Success/Failure */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.success === undefined ? '' : String(filters.success)}
                onChange={(e) =>
                  handleFilterChange(
                    'success',
                    e.target.value === '' ? undefined : e.target.value === 'true'
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="true">Success</option>
                <option value="false">Failure</option>
              </select>
            </div>

            {/* Actor Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actor Type
              </label>
              <select
                value={filters.actorType || ''}
                onChange={(e) => handleFilterChange('actorType', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actors</option>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="SYSTEM">System</option>
                <option value="SERVICE">Service</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : auditData && auditData.events.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditData.events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(event.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                          event.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                          event.method === 'POST' ? 'bg-green-100 text-green-800' :
                          event.method === 'PUT' || event.method === 'PATCH' ? 'bg-yellow-100 text-yellow-800' :
                          event.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.method || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {event.url || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {event.success ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-700">{event.statusCode || 200}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-700">{event.statusCode || 500}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                        {event.msg || event.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-900">
                              {event.actorEmail || 'System'}
                            </span>
                            <span className="text-xs text-gray-500">{event.actorType}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.durationMs ? `${event.durationMs}ms` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(auditData.pagination.page - 1) * auditData.pagination.limit + 1} to{' '}
                  {Math.min(
                    auditData.pagination.page * auditData.pagination.limit,
                    auditData.pagination.total
                  )}{' '}
                  of {auditData.pagination.total} events
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(auditData.pagination.page - 1)}
                    disabled={auditData.pagination.page === 1}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {auditData.pagination.page} of {auditData.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(auditData.pagination.page + 1)}
                    disabled={auditData.pagination.page >= auditData.pagination.totalPages}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500">
              {hasActiveFilters ? 'No events found matching your filters' : 'No audit events yet'}
            </p>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Event Details</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Event ID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedEvent.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Timestamp</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedEvent.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Method</label>
                  <p className="text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                      selectedEvent.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                      selectedEvent.method === 'POST' ? 'bg-green-100 text-green-800' :
                      selectedEvent.method === 'PUT' || selectedEvent.method === 'PATCH' ? 'bg-yellow-100 text-yellow-800' :
                      selectedEvent.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedEvent.method || '-'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">URL</label>
                  <p className="text-sm text-gray-900 font-mono break-all">{selectedEvent.url || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status Code</label>
                  <p className="text-sm text-gray-900">
                    {selectedEvent.success ? (
                      <span className="text-green-600">{selectedEvent.statusCode || 200}</span>
                    ) : (
                      <span className="text-red-600">{selectedEvent.statusCode || 500}</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Duration</label>
                  <p className="text-sm text-gray-900">{selectedEvent.durationMs ? `${selectedEvent.durationMs}ms` : '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Event Type</label>
                  <p className="text-sm text-gray-900">{selectedEvent.eventType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Action</label>
                  <p className="text-sm text-gray-900">{selectedEvent.action}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Actor</label>
                  <p className="text-sm text-gray-900">
                    {selectedEvent.actorEmail || 'System'} ({selectedEvent.actorType})
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Success</label>
                  <p className="text-sm text-gray-900">
                    {selectedEvent.success ? (
                      <span className="text-green-600">Success</span>
                    ) : (
                      <span className="text-red-600">Failed - {selectedEvent.errorCode}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Message */}
              {selectedEvent.msg && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Message</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-900">{selectedEvent.msg}</p>
                  </div>
                </div>
              )}

              {/* Request Context */}
              {(selectedEvent.requestId || selectedEvent.ipAddress) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Request Context</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {selectedEvent.requestId && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Request ID</label>
                        <p className="text-sm text-gray-900 font-mono">{selectedEvent.requestId}</p>
                      </div>
                    )}
                    {selectedEvent.ipAddress && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">IP Address</label>
                        <p className="text-sm text-gray-900">{selectedEvent.ipAddress}</p>
                      </div>
                    )}
                    {selectedEvent.userAgent && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">User Agent</label>
                        <p className="text-sm text-gray-900 truncate">{selectedEvent.userAgent}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Details */}
              {!selectedEvent.success && selectedEvent.errorMessage && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Error Details</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-900">{selectedEvent.errorMessage}</p>
                    {selectedEvent.exceptionType && (
                      <p className="text-xs text-red-600 mt-2 font-mono">
                        {selectedEvent.exceptionType}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Data Changes */}
              {selectedEvent.diffJson && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Changes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-xs text-gray-900 overflow-x-auto">
                      {JSON.stringify(selectedEvent.diffJson, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Before/After States */}
              {(selectedEvent.beforeJson || selectedEvent.afterJson) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedEvent.beforeJson && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Before</h3>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <pre className="text-xs text-gray-900">
                          {JSON.stringify(selectedEvent.beforeJson, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  {selectedEvent.afterJson && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">After</h3>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <pre className="text-xs text-gray-900">
                          {JSON.stringify(selectedEvent.afterJson, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedEvent.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">{selectedEvent.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
