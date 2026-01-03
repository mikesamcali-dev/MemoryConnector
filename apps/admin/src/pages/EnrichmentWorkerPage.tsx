import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEnrichmentWorkerStatus, triggerEnrichment } from '../api/admin';
import { Activity, Play, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export function EnrichmentWorkerPage() {
  const [triggerMessage, setTriggerMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: status, isLoading, error } = useQuery({
    queryKey: ['admin', 'enrichment-worker'],
    queryFn: getEnrichmentWorkerStatus,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const triggerMutation = useMutation({
    mutationFn: triggerEnrichment,
    onSuccess: (data) => {
      setTriggerMessage(data.message || 'Enrichment triggered successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'enrichment-worker'] });
      setTimeout(() => setTriggerMessage(''), 5000);
    },
    onError: (error: Error) => {
      setTriggerMessage(`Error: ${error.message}`);
      setTimeout(() => setTriggerMessage(''), 5000);
    },
  });

  const handleTrigger = () => {
    triggerMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading enrichment worker status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">Error loading status: {error.message}</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">No status data available</div>
      </div>
    );
  }

  const isWorkerActive = status.worker.isActive;
  const hasPending = status.queue.pending > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enrichment Worker</h1>
            <p className="text-sm text-gray-500">Background AI enrichment processing status</p>
          </div>
        </div>
        <button
          onClick={handleTrigger}
          disabled={triggerMutation.isPending}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          <span>{triggerMutation.isPending ? 'Triggering...' : 'Trigger Now'}</span>
        </button>
      </div>

      {/* Trigger Message */}
      {triggerMessage && (
        <div className={`p-4 rounded-lg ${
          triggerMessage.startsWith('Error')
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {triggerMessage}
        </div>
      )}

      {/* Worker Status */}
      <div className={`rounded-lg p-6 ${
        isWorkerActive ? 'bg-green-50 border-2 border-green-200' : 'bg-yellow-50 border-2 border-yellow-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {isWorkerActive ? (
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            ) : (
              <div className="bg-yellow-100 rounded-full p-3">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Worker Status: {isWorkerActive ? 'Active' : 'Idle'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {status.worker.lastProcessedAt
                  ? `Last processed: ${new Date(status.worker.lastProcessedAt).toLocaleString()}`
                  : 'Never processed'}
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg ${
            isWorkerActive ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            <span className={`text-lg font-bold ${
              isWorkerActive ? 'text-green-900' : 'text-yellow-900'
            }`}>
              {isWorkerActive ? 'RUNNING' : 'IDLE'}
            </span>
          </div>
        </div>
      </div>

      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pending */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {status.queue.pending.toLocaleString()}
              </p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Processing */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {status.queue.processing.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Completed Today */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {status.queue.completedToday.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Failed Today */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {status.queue.failedToday.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Success Rate */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Success Rate</h3>
        <div className="space-y-4">
          {/* Success Rate Calculation */}
          {(() => {
            const total = status.queue.completedToday + status.queue.failedToday;
            const successRate = total > 0 ? (status.queue.completedToday / total) * 100 : 0;

            return (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="text-2xl font-bold text-gray-900">{successRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      successRate >= 90 ? 'bg-green-500' : successRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${successRate}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-lg font-semibold text-green-600">{status.queue.completedToday}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Failed</p>
                    <p className="text-lg font-semibold text-red-600">{status.queue.failedToday}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Processed</p>
                    <p className="text-lg font-semibold text-gray-900">{total}</p>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Queue Health */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Health</h3>
        <div className="space-y-4">
          {/* Worker Status */}
          <div className={`flex items-center justify-between p-4 rounded-lg ${
            isWorkerActive ? 'bg-green-50' : 'bg-yellow-50'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                isWorkerActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`}></div>
              <span className="font-medium text-gray-900">Worker Process</span>
            </div>
            <span className={`text-sm font-medium ${
              isWorkerActive ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {isWorkerActive ? 'Running' : 'Idle'}
            </span>
          </div>

          {/* Queue Status */}
          <div className={`flex items-center justify-between p-4 rounded-lg ${
            hasPending ? 'bg-yellow-50' : 'bg-green-50'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                hasPending ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
              <span className="font-medium text-gray-900">Queue Status</span>
            </div>
            <span className={`text-sm font-medium ${
              hasPending ? 'text-yellow-700' : 'text-green-700'
            }`}>
              {hasPending ? `${status.queue.pending} items waiting` : 'Empty'}
            </span>
          </div>

          {/* Error Rate */}
          <div className={`flex items-center justify-between p-4 rounded-lg ${
            status.queue.failedToday > 0 ? 'bg-red-50' : 'bg-green-50'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                status.queue.failedToday > 0 ? 'bg-red-500' : 'bg-green-500'
              }`}></div>
              <span className="font-medium text-gray-900">Error Rate</span>
            </div>
            <span className={`text-sm font-medium ${
              status.queue.failedToday > 0 ? 'text-red-700' : 'text-green-700'
            }`}>
              {status.queue.failedToday} failures today
            </span>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">About Enrichment Worker</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• The enrichment worker processes AI enrichment tasks in the background</li>
          <li>• Worker polls the queue every 5 seconds for new tasks</li>
          <li>• "Trigger Now" manually processes the queue immediately</li>
          <li>• Failed jobs can be retried from the "Failed Jobs" page</li>
          <li>• Statistics reset at midnight server time</li>
        </ul>
      </div>
    </div>
  );
}
