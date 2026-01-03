import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTikTokVideo, getTikTokVideoMemories, enrichTikTokVideo } from '../api/tiktok';
import { ArrowLeft, Video, Calendar, Eye, ThumbsUp, Share2, MessageCircle, FileText, ExternalLink, Sparkles, Loader, Plus } from 'lucide-react';

export function TikTokVideoDetailPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch video details
  const { data: video, isLoading: videoLoading } = useQuery({
    queryKey: ['tiktok-video', videoId],
    queryFn: () => getTikTokVideo(videoId!),
    enabled: !!videoId,
  });

  // Fetch memories for this video
  const { data: memories, isLoading: memoriesLoading } = useQuery({
    queryKey: ['tiktok-video-memories', videoId],
    queryFn: () => getTikTokVideoMemories(videoId!),
    enabled: !!videoId,
  });

  // Enrich mutation
  const enrichMutation = useMutation({
    mutationFn: () => enrichTikTokVideo(videoId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-video', videoId] });
    },
  });

  const isLoading = videoLoading || memoriesLoading;

  const formatNumber = (num: number | null) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading TikTok video...</div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Video Not Found</h2>
          <p className="text-gray-600 mb-6">
            The TikTok video you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate('/app/tiktok-videos')}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Back to TikTok Videos
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
          onClick={() => navigate('/app/tiktok-videos')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to TikTok Videos
        </button>
      </div>

      {/* Video Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex gap-6">
          {/* Thumbnail */}
          {video.thumbnailUrl ? (
            <div className="flex-shrink-0">
              <div className="w-48 aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="flex-shrink-0 w-48 aspect-[9/16] bg-gray-100 rounded-lg flex items-center justify-center">
              <Video className="h-12 w-12 text-gray-300" />
            </div>
          )}

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{video.title}</h1>

            {/* Creator Info */}
            <div className="flex items-center gap-3 mb-4">
              <div>
                <div className="font-semibold text-gray-900">{video.creatorDisplayName}</div>
                {video.creatorUsername && (
                  <div className="text-sm text-gray-500">@{video.creatorUsername}</div>
                )}
              </div>
            </div>

            {/* Description */}
            {video.description && (
              <div className="mb-4">
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{video.description}</p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {video.viewCount !== null && (
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatNumber(video.viewCount)}
                    </div>
                    <div className="text-xs text-gray-500">Views</div>
                  </div>
                </div>
              )}

              {video.likeCount !== null && (
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatNumber(video.likeCount)}
                    </div>
                    <div className="text-xs text-gray-500">Likes</div>
                  </div>
                </div>
              )}

              {video.shareCount !== null && (
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatNumber(video.shareCount)}
                    </div>
                    <div className="text-xs text-gray-500">Shares</div>
                  </div>
                </div>
              )}

              {video.commentCount !== null && (
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatNumber(video.commentCount)}
                    </div>
                    <div className="text-xs text-gray-500">Comments</div>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {video.publishedAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(video.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              )}
              {video.durationSeconds && (
                <div className="flex items-center gap-1">
                  <Video className="h-4 w-4" />
                  {formatDuration(video.durationSeconds)}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-col gap-3">
              {/* Prominent Add Memory Button */}
              <button
                onClick={() => navigate('/app/capture', { state: { tiktokVideoId: video.id } })}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="h-6 w-6" />
                Add Memory & Reminders
              </button>

              {/* Secondary Actions */}
              <div className="flex gap-3">
                <a
                  href={video.canonicalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on TikTok
                </a>
                <button
                  onClick={() => enrichMutation.mutate()}
                  disabled={enrichMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50"
                >
                  {enrichMutation.isPending ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Enriching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Enrich with Whisper
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Section */}
      {video.transcript && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Transcript</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{video.transcript}</p>
          </div>
        </div>
      )}

      {/* Extracted Data Section */}
      {video.extractedData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Extracted Information</h2>

          {/* Summary */}
          {video.extractedData.summary && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
              <p className="text-gray-900">{video.extractedData.summary}</p>
            </div>
          )}

          {/* Topic Labels */}
          {video.extractedData.topic_labels && video.extractedData.topic_labels.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Topics</h3>
              <div className="flex flex-wrap gap-2">
                {video.extractedData.topic_labels.map((topic: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Points */}
          {video.extractedData.key_points && video.extractedData.key_points.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Key Points</h3>
              <ul className="list-disc list-inside space-y-1">
                {video.extractedData.key_points.map((point: string, i: number) => (
                  <li key={i} className="text-gray-900">{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* People */}
          {video.extractedData.people && video.extractedData.people.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">People Mentioned</h3>
              <div className="space-y-2">
                {video.extractedData.people.map((person: any, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-medium text-gray-900">{person.name}</span>
                    {person.role && <span className="text-gray-600">({person.role})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brands/Products */}
          {video.extractedData.brands_or_products && video.extractedData.brands_or_products.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Brands & Products</h3>
              <div className="space-y-2">
                {video.extractedData.brands_or_products.map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    {item.type && <span className="text-gray-600">({item.type})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calls to Action */}
          {video.extractedData.calls_to_action && video.extractedData.calls_to_action.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Calls to Action</h3>
              <ul className="list-disc list-inside space-y-1">
                {video.extractedData.calls_to_action.map((cta: string, i: number) => (
                  <li key={i} className="text-gray-900">{cta}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Memories List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Memories for this Video ({memories?.length || 0})
          </h2>

          {isLoading ? (
            <div className="text-center py-8 text-gray-600">
              Loading memories...
            </div>
          ) : !memories || memories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="mb-4">No memories linked to this video yet</p>
              <button
                onClick={() => navigate('/app/capture', { state: { tiktokVideoId: video?.id } })}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="h-5 w-5" />
                Add Memory & Reminders
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {memories.map((memory: any) => (
                <div
                  key={memory.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/app/memories/${memory.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {memory.title && (
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {memory.title}
                        </h3>
                      )}
                      {memory.body && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {memory.body}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/memories/${memory.id}`);
                      }}
                      className="ml-3 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 flex-shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(memory.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>

                    {memory.user && (
                      <div className="flex items-center gap-1">
                        <span>by {memory.user.email}</span>
                      </div>
                    )}

                    {memory.state && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        memory.state === 'ENRICHED' ? 'bg-green-100 text-green-800' :
                        memory.state === 'ENRICHING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {memory.state}
                      </span>
                    )}
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
