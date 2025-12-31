import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllYouTubeVideos,
  createYouTubeVideoFromUrl,
  deleteYouTubeVideo,
  YouTubeVideo,
} from '../api/admin';
import { ArrowLeft, Video, Search, Trash2, ExternalLink, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function YouTubeBuilderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Fetch all YouTube videos
  const { data: videos, isLoading } = useQuery({
    queryKey: ['youtube-videos'],
    queryFn: () => getAllYouTubeVideos(0, 100),
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: (id: string) => deleteYouTubeVideo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-videos'] });
    },
  });

  // Filter videos by search term (searches title and description)
  const filteredVideos = videos?.filter(video => {
    const search = searchTerm.toLowerCase();
    return (
      video.title.toLowerCase().includes(search) ||
      video.description?.toLowerCase().includes(search)
    );
  });

  const handleAddVideo = async () => {
    if (!youtubeUrl.trim()) {
      setExtractError('Please enter a YouTube URL');
      return;
    }

    setExtracting(true);
    setExtractError(null);

    try {
      // Create video from URL (auto-fetches metadata)
      await createYouTubeVideoFromUrl(youtubeUrl);
      queryClient.invalidateQueries({ queryKey: ['youtube-videos'] });

      setYoutubeUrl('');
      setExtractError(null);
    } catch (error: any) {
      setExtractError(error.message || 'Failed to add YouTube video');
    } finally {
      setExtracting(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const totalMinutes = Math.round(seconds / 60);
    if (totalMinutes === 1) {
      return '1 minute';
    }
    return `${totalMinutes} minutes`;
  };


  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/app')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
        <div className="flex items-center gap-3 mb-2">
          <Video className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">YouTube Videos</h1>
        </div>
        <p className="text-gray-600">
          Add and manage YouTube videos for your memories
        </p>
      </div>

      {/* Add Video Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add YouTube Video</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YouTube URL
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddVideo();
                }
              }}
            />
            <p className="mt-1 text-xs text-gray-500">
              Paste a YouTube video URL. We'll extract the video ID and create a record.
            </p>
          </div>

          {extractError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
              {extractError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleAddVideo}
              disabled={extracting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {extracting ? 'Adding...' : 'Add Video'}
            </button>
            <button
              onClick={() => {
                setYoutubeUrl('');
                setExtractError(null);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search videos by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Videos Count */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Your Videos ({filteredVideos?.length || 0})
        </h2>
      </div>

      {/* Videos List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">

          {isLoading ? (
            <div className="text-center py-8 text-gray-600">Loading videos...</div>
          ) : !filteredVideos || filteredVideos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Video className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No YouTube videos yet</p>
              <p className="text-sm mt-2">
                {searchTerm
                  ? 'No videos match your search'
                  : 'Add your first video to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVideos.map((video: YouTubeVideo) => (
                <div
                  key={video.id}
                  onClick={() => navigate(`/app/youtube-videos/${video.id}/memories`)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-40 h-24 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-40 h-24 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                        <Video className="h-8 w-8 text-gray-400" />
                      </div>
                    )}

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {video.title}
                      </h3>

                      {/* Duration */}
                      {video.durationSeconds > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(video.durationSeconds)}</span>
                        </div>
                      )}

                      {/* Description */}
                      {video.description && (
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {video.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-start gap-2 flex-shrink-0">
                      <a
                        href={video.canonicalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Open on YouTube"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete "${video.title}"?`)) {
                            deleteVideoMutation.mutate(video.id);
                          }
                        }}
                        disabled={deleteVideoMutation.isPending}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        title="Delete video"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
