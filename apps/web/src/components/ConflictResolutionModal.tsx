import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export interface ConflictData {
  type: 'DUPLICATE_CONTENT' | 'IDEMPOTENCY_KEY_REUSED' | 'LIMIT_EXCEEDED' | 'UNKNOWN';
  localMemory: {
    id: string;
    textContent?: string;
    imageUrl?: string;
    queuedAt: number;
  };
  serverResponse?: {
    existingMemoryId?: string;
    message?: string;
  };
}

interface ConflictResolutionModalProps {
  conflict: ConflictData;
  onResolve: (action: 'keep-local' | 'discard' | 'view-existing') => void;
  onClose: () => void;
}

export function ConflictResolutionModal({
  conflict,
  onResolve,
  onClose,
}: ConflictResolutionModalProps) {
  const [resolving, setResolving] = useState(false);

  const handleResolve = async (action: 'keep-local' | 'discard' | 'view-existing') => {
    setResolving(true);
    try {
      await onResolve(action);
    } finally {
      setResolving(false);
    }
  };

  const getTitle = () => {
    switch (conflict.type) {
      case 'DUPLICATE_CONTENT':
        return 'Duplicate Memory Detected';
      case 'IDEMPOTENCY_KEY_REUSED':
        return 'Sync Conflict Detected';
      case 'LIMIT_EXCEEDED':
        return 'Daily Limit Reached';
      default:
        return 'Sync Error';
    }
  };

  const getMessage = () => {
    switch (conflict.type) {
      case 'DUPLICATE_CONTENT':
        return 'This memory appears to already exist on the server. It may have been created from another device or browser.';
      case 'IDEMPOTENCY_KEY_REUSED':
        return 'This memory conflicts with another memory that was already synced. This can happen if you created similar memories while offline.';
      case 'LIMIT_EXCEEDED':
        return 'You have reached your daily memory limit. This memory will remain in the offline queue until tomorrow.';
      default:
        return 'An error occurred while syncing this memory. Would you like to retry or discard it?';
    }
  };

  const getActions = () => {
    switch (conflict.type) {
      case 'DUPLICATE_CONTENT':
        return (
          <>
            {conflict.serverResponse?.existingMemoryId && (
              <button
                onClick={() => handleResolve('view-existing')}
                disabled={resolving}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50"
              >
                View Existing
              </button>
            )}
            <button
              onClick={() => handleResolve('discard')}
              disabled={resolving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Discard Local Copy
            </button>
          </>
        );

      case 'IDEMPOTENCY_KEY_REUSED':
        return (
          <>
            <button
              onClick={() => handleResolve('keep-local')}
              disabled={resolving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Retry with New Key
            </button>
            <button
              onClick={() => handleResolve('discard')}
              disabled={resolving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Discard
            </button>
          </>
        );

      case 'LIMIT_EXCEEDED':
        return (
          <>
            <button
              onClick={() => handleResolve('keep-local')}
              disabled={resolving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Keep in Queue
            </button>
            <button
              onClick={() => handleResolve('discard')}
              disabled={resolving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Discard
            </button>
          </>
        );

      default:
        return (
          <>
            <button
              onClick={() => handleResolve('keep-local')}
              disabled={resolving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Retry
            </button>
            <button
              onClick={() => handleResolve('discard')}
              disabled={resolving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Discard
            </button>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900">{getTitle()}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">{getMessage()}</p>

          {/* Memory Preview */}
          {conflict.localMemory.textContent && (
            <div className="bg-gray-50 rounded-md p-3 mb-4">
              <p className="text-xs text-gray-500 mb-1">Local memory content:</p>
              <p className="text-sm text-gray-900 line-clamp-3">
                {conflict.localMemory.textContent}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Queued: {new Date(conflict.localMemory.queuedAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Server Message */}
          {conflict.serverResponse?.message && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-xs text-blue-700">{conflict.serverResponse.message}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t rounded-b-lg">
          {getActions()}
        </div>
      </div>
    </div>
  );
}
