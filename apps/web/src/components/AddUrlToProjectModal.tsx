import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Loader, Link2 } from 'lucide-react';
import { addUrl } from '../api/urlPages';
import { linkUrlPageToProject } from '../api/projects';

interface AddUrlToProjectModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddUrlToProjectModal({
  projectId,
  projectName,
  isOpen,
  onClose,
}: AddUrlToProjectModalProps) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');

  const [successMessage, setSuccessMessage] = useState('');

  const createAndLinkMutation = useMutation({
    mutationFn: async (urlInput: string) => {
      // Create the URL page
      const urlPage = await addUrl({ url: urlInput });

      // Link it to the project
      await linkUrlPageToProject(projectId, urlPage.id);

      return urlPage;
    },
    onSuccess: (urlPage) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setUrl('');

      // Show success message with warning if fetch failed
      if (urlPage.fetchFailed) {
        setSuccessMessage(urlPage.message || 'URL saved, but content could not be fetched');
        // Close after showing message briefly
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 3000);
      } else {
        onClose();
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      createAndLinkMutation.mutate(url.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Link2 className="h-6 w-6 text-blue-600" />
              Add URL to Project
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Add a new URL and link it to "{projectName}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={createAndLinkMutation.isPending}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-2">
              URL
            </label>
            <input
              id="url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com"
              required
              disabled={createAndLinkMutation.isPending}
              autoFocus
            />
          </div>

          {successMessage && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-700 font-medium">
                {successMessage}
              </p>
            </div>
          )}

          {createAndLinkMutation.isError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700 font-medium mb-1">
                Error adding URL
              </p>
              <p className="text-xs text-red-600">
                {createAndLinkMutation.error instanceof Error
                  ? createAndLinkMutation.error.message
                  : 'Please try again.'}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              disabled={createAndLinkMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim() || createAndLinkMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createAndLinkMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add URL
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
