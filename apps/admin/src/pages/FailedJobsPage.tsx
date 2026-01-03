import { useQuery } from '@tanstack/react-query';
import { getFailedJobs } from '../api/admin';
import { AlertTriangle, Clock, FileText } from 'lucide-react';

interface FailedJob {
  memoryId: string;
  title: string | null;
  body: string | null;
  state: string;
  failedAt: string;
  error: string;
  attemptsMade: number;
  maxRetries: number;
}

export function FailedJobsPage() {
  const { data: failedJobs = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'failed-jobs'],
    queryFn: getFailedJobs,
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading failed jobs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">Error loading failed jobs: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Failed Jobs</h1>
            <p className="text-sm text-gray-500">Enrichment jobs that failed or are stuck</p>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Total Failed: <span className="font-semibold text-red-600">{failedJobs.length}</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Total Failed</p>
              <p className="text-2xl font-bold text-red-900">{failedJobs.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Stuck Jobs</p>
              <p className="text-2xl font-bold text-yellow-900">
                {failedJobs.filter((j: FailedJob) => j.error.includes('stuck')).length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Max Retries Reached</p>
              <p className="text-2xl font-bold text-orange-900">
                {failedJobs.filter((j: FailedJob) => j.attemptsMade >= j.maxRetries).length}
              </p>
            </div>
            <FileText className="h-8 w-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Failed Jobs List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Failed Enrichment Jobs</h3>
        </div>

        {failedJobs.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No failed jobs - all systems operational!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {failedJobs.map((job: FailedJob) => (
              <div key={job.memoryId} className="p-6 hover:bg-gray-50">
                {/* Job Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-red-100 rounded-full p-2 mt-1">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {job.title || 'Untitled Memory'}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">Memory ID: {job.memoryId}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      job.attemptsMade >= job.maxRetries
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {job.state}
                    </span>
                    <span className="text-xs text-gray-500">
                      {job.attemptsMade}/{job.maxRetries} attempts
                    </span>
                  </div>
                </div>

                {/* Memory Body */}
                {job.body && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 line-clamp-2">{job.body}</p>
                  </div>
                )}

                {/* Error Details */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Error:</p>
                      <p className="text-sm text-red-700 mt-1">{job.error}</p>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Failed: {new Date(job.failedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Section */}
      {failedJobs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Troubleshooting Failed Jobs</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Check the "Enrichment Failures" page for detailed retry options</li>
            <li>• Verify AI Circuit Breaker status on the "AI Costs" page</li>
            <li>• Stuck jobs may indicate worker process issues</li>
            <li>• Jobs stuck for over 1 hour are automatically flagged as failed</li>
          </ul>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <a
            href="/failures"
            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium"
          >
            View Detailed Failures
          </a>
          <a
            href="/enrichment"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            Check Worker Status
          </a>
          <a
            href="/ai-costs"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            Check Circuit Breaker
          </a>
        </div>
      </div>
    </div>
  );
}
