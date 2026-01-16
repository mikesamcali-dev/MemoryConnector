import { useParams, useNavigate } from 'react-router-dom';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTwitterPost, getTwitterPostMemories, enrichTwitterPost } from '../api/twitter';
import { ArrowLeft, Twitter, Calendar, Eye, ThumbsUp, Repeat2, MessageCircle, ExternalLink, Sparkles, Loader, Plus, Quote, Bookmark } from 'lucide-react';

export function TwitterPostDetailPage() {
    const helpPopup = useHelpPopup('twitter-posts');
const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch post details
  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['twitter-post', postId],
    queryFn: () => getTwitterPost(postId!),
    enabled: !!postId,
  });

  // Fetch memories for this post
  const { data: memories, isLoading: memoriesLoading } = useQuery({
    queryKey: ['twitter-post-memories', postId],
    queryFn: () => getTwitterPostMemories(postId!),
    enabled: !!postId,
  });

  // Enrich mutation
  const enrichMutation = useMutation({
    mutationFn: () => enrichTwitterPost(postId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['twitter-post', postId] });
    },
  });

  const isLoading = postLoading || memoriesLoading;

  const formatNumber = (num: bigint | number | null) => {
    if (!num) return '0';
    const value = typeof num === 'bigint' ? Number(num) : num;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading X (Twitter) post...</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Post Not Found</h2>
          <p className="text-gray-600 mb-6">
            The X (Twitter) post you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate('/app/twitter-posts')}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Back to X (Twitter) Posts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/app/twitter-posts')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to X (Twitter) Posts
        </button>
      </div>

      {/* Post Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
        {/* Creator Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0">
            <Twitter className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xl text-gray-900">{post.creatorDisplayName}</div>
            {post.creatorUsername && (
              <div className="text-base text-gray-500">@{post.creatorUsername}</div>
            )}
          </div>
        </div>

        {/* Post Text */}
        <div className="mb-6">
          <p className="text-lg text-gray-900 whitespace-pre-wrap leading-relaxed">{post.text}</p>
        </div>

        {/* Post Type Indicators */}
        {(post.isReply || post.isRetweet || post.isQuote) && (
          <div className="flex gap-2 mb-4">
            {post.isReply && (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                Reply
              </span>
            )}
            {post.isRetweet && (
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                Retweet
              </span>
            )}
            {post.isQuote && (
              <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                Quote
              </span>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
          {post.viewCount !== null && (
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
              <Eye className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-base md:text-lg font-semibold text-gray-900 truncate">
                  {formatNumber(post.viewCount)}
                </div>
                <div className="text-xs text-gray-500">Views</div>
              </div>
            </div>
          )}

          {post.likeCount !== null && (
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
              <ThumbsUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-base md:text-lg font-semibold text-gray-900 truncate">
                  {formatNumber(post.likeCount)}
                </div>
                <div className="text-xs text-gray-500">Likes</div>
              </div>
            </div>
          )}

          {post.retweetCount !== null && (
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
              <Repeat2 className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-base md:text-lg font-semibold text-gray-900 truncate">
                  {formatNumber(post.retweetCount)}
                </div>
                <div className="text-xs text-gray-500">Retweets</div>
              </div>
            </div>
          )}

          {post.replyCount !== null && (
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
              <MessageCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-base md:text-lg font-semibold text-gray-900 truncate">
                  {formatNumber(post.replyCount)}
                </div>
                <div className="text-xs text-gray-500">Replies</div>
              </div>
            </div>
          )}

          {post.quoteCount !== null && (
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
              <Quote className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-base md:text-lg font-semibold text-gray-900 truncate">
                  {formatNumber(post.quoteCount)}
                </div>
                <div className="text-xs text-gray-500">Quotes</div>
              </div>
            </div>
          )}

          {post.bookmarkCount !== null && (
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
              <Bookmark className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-base md:text-lg font-semibold text-gray-900 truncate">
                  {formatNumber(post.bookmarkCount)}
                </div>
                <div className="text-xs text-gray-500">Bookmarks</div>
              </div>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
          {post.publishedAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {/* Prominent Add Memory Button */}
          <button
            onClick={() => navigate('/app/capture', { state: { twitterPostId: post.id } })}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all touch-manipulation"
          >
            <Plus className="h-5 w-5 md:h-6 md:w-6" />
            <span>Add Memory & Reminders</span>
          </button>

          {/* Secondary Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={post.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 text-sm md:text-base font-medium touch-manipulation"
            >
              <ExternalLink className="h-4 w-4 md:h-5 md:w-5" />
              <span>View on X</span>
            </a>
            <button
              onClick={() => enrichMutation.mutate()}
              disabled={enrichMutation.isPending}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm md:text-base font-medium disabled:opacity-50 touch-manipulation"
            >
              {enrichMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                  <span>Enriching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
                  <span>Enrich with AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Enrichment Section */}
      {(post.summary || post.topics || post.sentiment) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h2>

          {/* Summary */}
          {post.summary && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
              <p className="text-gray-900">{post.summary}</p>
            </div>
          )}

          {/* Topics */}
          {post.topics && Array.isArray(post.topics) && post.topics.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Topics</h3>
              <div className="flex flex-wrap gap-2">
                {post.topics.map((topic: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sentiment */}
          {post.sentiment && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Sentiment</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                post.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                post.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {post.sentiment.charAt(0).toUpperCase() + post.sentiment.slice(1)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Hashtags Section */}
      {post.hashtags && Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Hashtags</h2>
          <div className="flex flex-wrap gap-2">
            {post.hashtags.map((tag: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Mentions Section */}
      {post.mentions && Array.isArray(post.mentions) && post.mentions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Mentions</h2>
          <div className="flex flex-wrap gap-2">
            {post.mentions.map((mention: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                @{mention}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Linked Memories Section */}
      {memories && memories.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Linked Memories ({memories.length})
          </h2>
          <div className="space-y-3">
            {memories.map((memory) => (
              <div
                key={memory.id}
                onClick={() => navigate(`/app/memories/${memory.id}`)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <p className="text-gray-900 line-clamp-2">{memory.textContent}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {new Date(memory.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
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