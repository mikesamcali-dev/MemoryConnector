import { useState, useMemo } from 'react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useNavigate } from 'react-router-dom';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import {
  getAllTwitterPosts,
  extractTwitterMetadata,
  createTwitterPost,
  updateTwitterPost,
  deleteTwitterPost,
  TwitterPost
} from '../api/twitter';
import {
  ArrowLeft,
  Twitter,
  Calendar,
  Plus,
  Eye,
  ThumbsUp,
  Repeat2,
  MessageCircle,
  Loader,
  Sparkles,
  Edit2,
  Trash2,
  X,
  Check,
  Search,
  Quote,
  Bookmark
} from 'lucide-react';

export function TwitterPostsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Add form state
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Edit modal state
  const [editingPost, setEditingPost] = useState<TwitterPost | null>(null);
  const [editForm, setEditForm] = useState({
    text: '',
    creatorDisplayName: '',
  });

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['twitter-posts'],
    queryFn: () => getAllTwitterPosts(0, 100),
  });

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    if (!searchQuery.trim()) return posts;

    const query = searchQuery.toLowerCase();
    return posts.filter((post) => {
      return (
        post.text.toLowerCase().includes(query) ||
        post.creatorDisplayName.toLowerCase().includes(query) ||
        (post.creatorUsername && post.creatorUsername.toLowerCase().includes(query))
      );
    });
  }, [posts, searchQuery]);

  // Create mutation
  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a Twitter/X URL');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Extract metadata from URL
      const metadata = await extractTwitterMetadata(url.trim());

      // Step 2: Create the post with extracted metadata
      await createTwitterPost({
        twitterPostId: metadata.twitterPostId,
        canonicalUrl: metadata.canonicalUrl || url.trim(),
        text: metadata.text,
        creatorDisplayName: metadata.creatorDisplayName,
        creatorUsername: metadata.creatorUsername,
        publishedAt: metadata.publishedAt,
      });

      // Step 3: Invalidate cache and clear form
      queryClient.invalidateQueries({ queryKey: ['twitter-posts'] });
      setUrl('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to add Twitter post. Please check the URL and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TwitterPost> }) =>
      updateTwitterPost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['twitter-posts'] });
      setEditingPost(null);
    },
  });

  const handleEditClick = (post: TwitterPost, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPost(post);
    setEditForm({
      text: post.text,
      creatorDisplayName: post.creatorDisplayName,
    });
  };

  const handleUpdatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    updateMutation.mutate({
      id: editingPost.id,
      data: editForm,
    });
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTwitterPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['twitter-posts'] });
      setDeletingId(null);
    },
  });

  const handleDeleteClick = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(postId);
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    deleteMutation.mutate(deletingId);
  };

  const formatNumber = (num: bigint | number | null) => {
    if (!num) return '0';
    const value = typeof num === 'bigint' ? Number(num) : num;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
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
        <h1 className="text-3xl font-bold text-gray-900">X (Twitter) Posts</h1>
        <p className="text-gray-600 mt-2">
          Browse and manage your X (Twitter) post collection
        </p>
      </div>

      {/* Add Post Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
        <form onSubmit={handleAddPost} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm md:text-base font-medium text-gray-700 mb-2">
              Add X (Twitter) Post
            </label>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://twitter.com/username/status/1234567890 or https://x.com/username/status/1234567890"
                className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                disabled={isProcessing}
                required
              />
              <button
                type="submit"
                disabled={isProcessing || !url.trim()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-base font-medium"
              >
                {isProcessing ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span>Add Post</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs md:text-sm text-gray-500 mt-2">
              <Sparkles className="inline h-3 w-3 mr-1" />
              Paste a Twitter/X URL - we'll automatically extract post details
            </p>
          </div>
        </form>
      </div>

      {/* Search Bar */}
      {posts && posts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts by text, creator, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Posts Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-600">Loading X (Twitter) posts...</div>
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Twitter className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No X (Twitter) Posts Yet</h2>
          <p className="text-gray-600">
            Start by adding your first X (Twitter) post using the form above
          </p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Search className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Posts Found</h2>
          <p className="text-gray-600">
            No posts match your search query. Try different keywords.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/app/twitter-posts/${post.id}`)}
            >
              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                      <Twitter className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 truncate">{post.creatorDisplayName}</span>
                        {post.creatorUsername && (
                          <span className="text-gray-500 text-sm truncate">@{post.creatorUsername}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={(e) => handleEditClick(post, e)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors touch-manipulation"
                      title="Edit post"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(post.id, e)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors touch-manipulation"
                      title="Delete post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-900 text-sm mb-3 line-clamp-4 whitespace-pre-wrap">
                  {post.text}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 pb-3 border-b border-gray-100">
                  {post.viewCount !== null && (
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{formatNumber(post.viewCount)}</span>
                    </div>
                  )}
                  {post.likeCount !== null && (
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{formatNumber(post.likeCount)}</span>
                    </div>
                  )}
                  {post.retweetCount !== null && (
                    <div className="flex items-center gap-1">
                      <Repeat2 className="h-3 w-3" />
                      <span>{formatNumber(post.retweetCount)}</span>
                    </div>
                  )}
                  {post.replyCount !== null && (
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{formatNumber(post.replyCount)}</span>
                    </div>
                  )}
                  {post.quoteCount !== null && (
                    <div className="flex items-center gap-1">
                      <Quote className="h-3 w-3" />
                      <span>{formatNumber(post.quoteCount)}</span>
                    </div>
                  )}
                  {post.bookmarkCount !== null && (
                    <div className="flex items-center gap-1">
                      <Bookmark className="h-3 w-3" />
                      <span>{formatNumber(post.bookmarkCount)}</span>
                    </div>
                  )}
                </div>

                {post.publishedAt && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-3">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit X (Twitter) Post</h2>
                <button
                  onClick={() => setEditingPost(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdatePost} className="space-y-4">
                <div>
                  <label htmlFor="edit-text" className="block text-sm font-medium text-gray-700 mb-1">
                    Post Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="edit-text"
                    value={editForm.text}
                    onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    required
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
                    onClick={() => setEditingPost(null)}
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete X (Twitter) Post?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
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
      {/* Help Popup */}
      <HelpPopup
        pageKey="twitter-posts"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}