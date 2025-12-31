import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { createTikTokVideo, extractTikTokMetadata } from '../api/tiktok';
import { ArrowLeft, Plus, Loader, Sparkles } from 'lucide-react';

export function TikTokBuilderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a TikTok URL');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Extract metadata from URL
      const metadata = await extractTikTokMetadata(url.trim());

      // Step 2: Create the video with extracted metadata
      await createTikTokVideo({
        tiktokVideoId: metadata.tiktokVideoId,
        canonicalUrl: metadata.canonicalUrl || url.trim(),
        title: metadata.title,
        description: metadata.description,
        thumbnailUrl: metadata.thumbnailUrl,
        creatorDisplayName: metadata.creatorDisplayName,
        creatorUsername: metadata.creatorUsername,
        creatorId: metadata.creatorId,
        publishedAt: metadata.publishedAt,
        durationSeconds: metadata.durationSeconds,
        transcript: metadata.transcript,
      });

      // Step 3: Invalidate cache and redirect
      queryClient.invalidateQueries({ queryKey: ['tiktok-videos'] });
      navigate('/app/tiktok-videos');
    } catch (err: any) {
      setError(err.message || 'Failed to add TikTok video. Please check the URL and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/app/tiktok-videos')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to TikTok Videos
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Add TikTok Video</h1>
        <p className="text-gray-600 mt-2">
          Manually add a TikTok video to your collection
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* URL Input */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              TikTok Video URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.tiktok.com/@username/video/1234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isProcessing}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              <Sparkles className="inline h-3 w-3 mr-1" />
              Paste a TikTok URL - we'll automatically extract all video details using AI
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/app/tiktok-videos')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !url.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Add TikTok Video
                </>
              )}
            </button>
          </div>

          <div className="text-center text-sm text-gray-500 pt-2">
            This will extract metadata and save the video automatically
          </div>
        </form>
      </div>
    </div>
  );
}
