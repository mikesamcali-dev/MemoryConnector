import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEnrichmentFailures,
  retryEnrichment,
  retryAllFailedEnrichments,
  EnrichmentFailure,
} from '../api/admin';
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export function EnrichmentFailuresPage() {
  const queryClient = useQueryClient();
  const [expandedMemory, setExpandedMemory] = useState<string | null>(null);
  const [retryingAll, setRetryingAll] = useState(false);

  const { data: failures, isLoading, error } = useQuery({
    queryKey: ['enrichment-failures'],
    queryFn: getEnrichmentFailures,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const retryMutation = useMutation({
    mutationFn: retryEnrichment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrichment-failures'] });
    },
  });

  const retryAllMutation = useMutation({
    mutationFn: retryAllFailedEnrichments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrichment-failures'] });
      setRetryingAll(false);
    },
  });

  const handleRetry = async (memoryId: string) => {
    await retryMutation.mutateAsync(memoryId);
  };

  const handleRetryAll = async () => {
    setRetryingAll(true);
    await retryAllMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading failed enrichments...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error loading failed enrichments: {error.message}</p>
        </div>
      </div>
    );
  }

  const failedMemories = failures?.filter(f => f.enrichmentStatus === 'failed') || [];
  const pendingMemories = failures?.filter(f => f.enrichmentStatus === 'pending') || [];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/app/admin"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enrichment Failures</h1>
            <p className="text-gray-600 mt-2">
              Monitor and retry failed or stuck enrichment jobs
            </p>
          </div>
          {failures && failures.length > 0 && (
            <button
              onClick={handleRetryAll}
              disabled={retryingAll || retryAllMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${retryingAll ? 'animate-spin' : ''}`} />
              Retry All ({failures.length > 50 ? '50' : failures.length})
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Issues</div>
          <div className="text-2xl font-bold text-gray-900">{failures?.length || 0}</div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-700 mb-1 flex items-center gap-1">
            <XCircle className="h-4 w-4" />
            Failed
          </div>
          <div className="text-2xl font-bold text-red-900">{failedMemories.length}</div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-700 mb-1 flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Pending
          </div>
          <div className="text-2xl font-bold text-yellow-900">{pendingMemories.length}</div>
        </div>
      </div>

      {/* Retry All Result */}
      {retryAllMutation.isSuccess && retryAllMutation.data && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Retry Complete</h3>
          </div>
          <p className="text-green-800">{retryAllMutation.data.summary}</p>
          <div className="text-sm text-green-700 mt-2">
            Queued: {retryAllMutation.data.queued} | Failed: {retryAllMutation.data.failed}
          </div>
        </div>
      )}

      {/* Failures List */}
      <div className="space-y-4">
        {failures && failures.length > 0 ? (
          failures.map((failure) => (
            <FailureCard
              key={failure.id}
              failure={failure}
              expanded={expandedMemory === failure.id}
              onToggleExpand={() =>
                setExpandedMemory(expandedMemory === failure.id ? null : failure.id)
              }
              onRetry={handleRetry}
              isRetrying={retryMutation.isPending && retryMutation.variables === failure.id}
            />
          ))
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">No Failed Enrichments</h3>
            <p className="text-green-700">
              All memories are processing normally. Great job!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface FailureCardProps {
  failure: EnrichmentFailure;
  expanded: boolean;
  onToggleExpand: () => void;
  onRetry: (id: string) => void;
  isRetrying: boolean;
}

function FailureCard({ failure, expanded, onToggleExpand, onRetry, isRetrying }: FailureCardProps) {
  const isFailed = failure.enrichmentStatus === 'failed';
  const isPending = failure.enrichmentStatus === 'pending';

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  return (
    <div
      className={`border-2 rounded-lg p-6 ${
        isFailed
          ? 'bg-red-50 border-red-200'
          : isPending
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-gray-50 border-gray-300'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isFailed ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : isPending ? (
              <Clock className="h-5 w-5 text-yellow-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-gray-400" />
            )}
            <h3 className="font-semibold text-gray-900">
              {failure.title || 'Untitled'}
            </h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded ${
                isFailed
                  ? 'bg-red-200 text-red-800'
                  : 'bg-yellow-200 text-yellow-800'
              }`}
            >
              {failure.enrichmentStatus.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">{failure.body}</p>
          <p className="text-xs text-gray-500">
            {failure.userEmail} • Created {formatDuration(failure.timeSinceCreation)}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onRetry(failure.id)}
            disabled={isRetrying}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
            Retry
          </button>
          <button
            onClick={onToggleExpand}
            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
          >
            {expanded ? 'Hide' : 'Show'} Logs
          </button>
        </div>
      </div>

      {/* Logs */}
      {expanded && (
        <div className="mt-4 border-t border-gray-300 pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Detailed Logs</h4>
          <div className="space-y-2 bg-white border border-gray-200 rounded-lg p-4 font-mono text-xs">
            <div className="text-gray-700">
              <span className="text-blue-600">[INFO]</span> {failure.logs.created}
            </div>
            <div className="text-gray-700">
              <span className="text-blue-600">[INFO]</span> {failure.logs.updated}
            </div>
            <div className="text-gray-700">
              <span className="text-blue-600">[INFO]</span> {failure.logs.queued}
            </div>
            <div className="text-gray-700">
              <span className="text-yellow-600">[WARN]</span> {failure.logs.status}
            </div>
            <div className="text-red-700 font-semibold mt-3">
              <span className="text-red-600">[ERROR]</span> {failure.logs.diagnosis}
            </div>
          </div>

          {/* Full Body */}
          {failure.fullBody && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 font-semibold">
                View Full Memory Content
              </summary>
              <div className="mt-2 text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                {failure.fullBody}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
