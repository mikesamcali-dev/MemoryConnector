import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllTikTokVideos,
  extractTikTokMetadata,
  createTikTokVideo,
  updateTikTokVideo,
  deleteTikTokVideo,
  TikTokVideo
} from '../api/tiktok';
import {
  ArrowLeft,
  Video,
  Calendar,
  Plus,
  Eye,
  ThumbsUp,
  Share2,
  MessageCircle,
  Loader,
  Sparkles,
  Edit2,
  Trash2,
  X,
  Check,
  Search
} from 'lucide-react';

export function TikTokVideosListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Add form state
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Edit modal state
  const [editingVideo, setEditingVideo] = useState<TikTokVideo | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    creatorDisplayName: '',
  });

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: videos, isLoading } = useQuery({
    queryKey: ['tiktok-videos'],
    queryFn: () => getAllTikTokVideos(0, 100),
  });

  // Filter videos based on search query
  const filteredVideos = useMemo(() => {
    if (!videos) return [];
    if (!searchQuery.trim()) return videos;

    const query = searchQuery.toLowerCase();
    return videos.filter((video) => {
      return (
        video.title.toLowerCase().includes(query) ||
        video.creatorDisplayName.toLowerCase().includes(query) ||
        (video.creatorUsername && video.creatorUsername.toLowerCase().includes(query)) ||
        (video.description && video.description.toLowerCase().includes(query))
      );
    });
  }, [videos, searchQuery]);

  // Create mutation
  const handleAddVideo = async (e: React.FormEvent) => {
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

      // Step 3: Invalidate cache and clear form
      queryClient.invalidateQueries({ queryKey: ['tiktok-videos'] });
      setUrl('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to add TikTok video. Please check the URL and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TikTokVideo> }) =>
      updateTikTokVideo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-videos'] });
      setEditingVideo(null);
    },
  });

  const handleEditClick = (video: TikTokVideo, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVideo(video);
    setEditForm({
      title: video.title,
      description: video.description || '',
      creatorDisplayName: video.creatorDisplayName,
    });
  };

  const handleUpdateVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    updateMutation.mutate({
      id: editingVideo.id,
      data: editForm,
    });
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTikTokVideo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-videos'] });
      setDeletingId(null);
    },
  });

  const handleDeleteClick = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(videoId);
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    deleteMutation.mutate(deletingId);
  };

  const formatNumber = (num: number | null) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/app/search')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Search
        </button>
        <h1 className="text-3xl font-bold text-gray-900">TikTok Videos</h1>
        <p className="text-gray-600 mt-2">
          Browse and manage your TikTok video collection
        </p>
      </div>

      {/* Add Video Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <form onSubmit={handleAddVideo} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Add TikTok Video
            </label>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            <div className="flex gap-3">
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@username/video/1234567890"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                disabled={isProcessing}
                required
              />
              <button
                type="submit"
                disabled={isProcessing || !url.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isProcessing ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Add Video
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <Sparkles className="inline h-3 w-3 mr-1" />
              Paste a TikTok URL - we'll automatically extract all video details using AI
            </p>
          </div>
        </form>
      </div>

      {/* Search Bar */}
      {videos && videos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos by title, creator, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Videos Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-600">Loading TikTok videos...</div>
        </div>
      ) : !videos || videos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Video className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No TikTok Videos Yet</h2>
          <p className="text-gray-600">
            Start by adding your first TikTok video using the form above
          </p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Search className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Videos Found</h2>
          <p className="text-gray-600">
            No videos match your search query. Try different keywords.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div
                onClick={() => navigate(`/app/tiktok-videos/${video.id}`)}
                className="cursor-pointer"
              >
                {video.thumbnailUrl ? (
                  <div className="aspect-[9/16] bg-gray-100 relative overflow-hidden">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-2 text-white text-sm">
                        <Video className="h-4 w-4" />
                        <span>TikTok</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[9/16] bg-gray-100 flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3
                    onClick={() => navigate(`/app/tiktok-videos/${video.id}`)}
                    className="font-semibold text-gray-900 line-clamp-2 cursor-pointer hover:text-gray-700 flex-1"
                  >
                    {video.title}
                  </h3>
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={(e) => handleEditClick(video, e)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit video"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(video.id, e)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete video"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <span className="font-medium">{video.creatorDisplayName}</span>
                  {video.creatorUsername && (
                    <span className="text-gray-400">@{video.creatorUsername}</span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  {video.viewCount !== null && (
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{formatNumber(video.viewCount)}</span>
                    </div>
                  )}
                  {video.likeCount !== null && (
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{formatNumber(video.likeCount)}</span>
                    </div>
                  )}
                  {video.shareCount !== null && (
                    <div className="flex items-center gap-1">
                      <Share2 className="h-3 w-3" />
                      <span>{formatNumber(video.shareCount)}</span>
                    </div>
                  )}
                  {video.commentCount !== null && (
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{formatNumber(video.commentCount)}</span>
                    </div>
                  )}
                </div>

                {video.publishedAt && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                    <Calendar className="h-3 w-3" />
                    {new Date(video.publishedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit TikTok Video</h2>
                <button
                  onClick={() => setEditingVideo(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateVideo} className="space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="edit-creator" className="block text-sm font-medium text-gray-700 mb-1">
                    Creator Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="edit-creator"
                    value={editForm.creatorDisplayName}
                    onChange={(e) => setEditForm({ ...editForm, creatorDisplayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingVideo(null)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={updateMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete TikTok Video?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this video? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
