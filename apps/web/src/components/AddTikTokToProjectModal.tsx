import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Loader, Film } from 'lucide-react';
import { extractTikTokMetadata, createTikTokVideo } from '../api/tiktok';
import { linkTikTokVideoToProject } from '../api/projects';

interface AddTikTokToProjectModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddTikTokToProjectModal({
  projectId,
  projectName,
  isOpen,
  onClose,
}: AddTikTokToProjectModalProps) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');

  const createAndLinkMutation = useMutation({
    mutationFn: async (videoUrl: string) => {
      // Extract TikTok metadata
      const metadata = await extractTikTokMetadata(videoUrl);

      // Create the TikTok video
      const video = await createTikTokVideo(metadata);

      // Link it to the project
      await linkTikTokVideoToProject(projectId, video.id);

      return video;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setUrl('');
      onClose();
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
              <Film className="h-6 w-6 text-pink-600" />
              Add TikTok Video to Project
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Add a new TikTok video and link it to "{projectName}"
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
            <label htmlFor="tiktok-url" className="block text-sm font-medium text-gray-700 mb-2">
              TikTok URL
            </label>
            <input
              id="tiktok-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="https://www.tiktok.com/@username/video/..."
              required
              disabled={createAndLinkMutation.isPending}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste any TikTok video URL
            </p>
          </div>

          {createAndLinkMutation.isError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">
                Error adding TikTok video. Please check the URL and try again.
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
              className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createAndLinkMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Video
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
