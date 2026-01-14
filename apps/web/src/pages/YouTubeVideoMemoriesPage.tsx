import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getYouTubeVideoMemories, getYouTubeVideo, enrichYouTubeVideo } from '../api/admin';
import { ArrowLeft, Video, Calendar, FileText, ExternalLink, Sparkles, Tags, MessageSquare, ThumbsUp, Eye, CheckCircle, Clock, Globe, RefreshCw, AlertCircle, Info, MessageCircle, Star } from 'lucide-react';
import { useState } from 'react';

export function YouTubeVideoMemoriesPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  // Fetch video details
  const { data: video, isLoading: videoLoading } = useQuery({
    queryKey: ['youtube-video', videoId],
    queryFn: () => getYouTubeVideo(videoId!),
    enabled: !!videoId,
  });

  // Fetch memories for this video
  const { data: memories, isLoading: memoriesLoading } = useQuery({
    queryKey: ['youtube-video-memories', videoId],
    queryFn: () => getYouTubeVideoMemories(videoId!),
    enabled: !!videoId,
  });

  // Enrich video mutation
  const enrichMutation = useMutation({
    mutationFn: () => enrichYouTubeVideo(videoId!),
    onSuccess: () => {
      // Optimistically update to show "queued" status immediately
      queryClient.setQueryData(['youtube-video', videoId], (old: any) => {
        if (!old) return old;
        return { ...old, ingestionStatus: 'queued' };
      });

      // Poll for completion - check every 2 seconds for up to 30 seconds
      let attempts = 0;
      const maxAttempts = 15;
      const pollInterval = setInterval(() => {
        attempts++;
        queryClient.invalidateQueries({ queryKey: ['youtube-video', videoId] });

        // Get the current data to check if ingested
        const currentData = queryClient.getQueryData(['youtube-video', videoId]) as any;
        if (currentData?.ingestionStatus === 'ingested' || attempts >= maxAttempts) {
          clearInterval(pollInterval);
        }
      }, 2000);
    },
  });

  const isLoading = videoLoading || memoriesLoading;

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/app/youtube-videos')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to YouTube Videos
        </button>

        {video && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            {/* Main Video Info */}
            <div className="p-6">
              <div className="flex gap-4">
                {/* Thumbnail */}
                {video.thumbnailUrl ? (
                  <a
                    href={video.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 block group"
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-48 h-28 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </a>
                ) : (
                  <a
                    href={video.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 block"
                  >
                    <div className="w-48 h-28 bg-gray-200 rounded flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
                      <Video className="h-12 w-12 text-gray-400" />
                    </div>
                  </a>
                )}

                {/* Video Info */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {video.title}
                  </h1>
                  <p className="text-gray-600 mb-3">
                    {video.creatorDisplayName}
                  </p>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(video.publishedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    {video.durationSeconds > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(video.durationSeconds)}</span>
                      </div>
                    )}
                    {video.viewCount !== null && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{video.viewCount.toLocaleString()} views</span>
                      </div>
                    )}
                    {video.likeCount !== null && (
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{video.likeCount.toLocaleString()} likes</span>
                      </div>
                    )}
                    {video.commentCount !== null && (
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{video.commentCount.toLocaleString()} comments</span>
                      </div>
                    )}
                    {video.favoriteCount !== null && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        <span>{video.favoriteCount.toLocaleString()} favorites</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      <span>{video.languageCode.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      video.ingestionStatus === 'ingested' ? 'bg-green-100 text-green-800' :
                      video.ingestionStatus === 'queued' ? 'bg-yellow-100 text-yellow-800' :
                      video.ingestionStatus === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      {video.ingestionStatus}
                    </span>
                    {video.transcriptStatus !== 'none' && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        video.transcriptStatus === 'full' ? 'bg-blue-100 text-blue-800' :
                        video.transcriptStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        video.transcriptStatus === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        Transcript: {video.transcriptStatus}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={video.canonicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Watch on YouTube
                    </a>
                    <button
                      onClick={() => enrichMutation.mutate()}
                      disabled={enrichMutation.isPending || video.ingestionStatus === 'queued'}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Re-enrich this video with AI"
                    >
                      <RefreshCw className={`h-4 w-4 ${(enrichMutation.isPending || video.ingestionStatus === 'queued') ? 'animate-spin' : ''}`} />
                      {enrichMutation.isPending
                        ? 'Enriching...'
                        : video.ingestionStatus === 'queued'
                        ? 'Queued...'
                        : 'Enrich Video'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            {video.summary && (
              <div className="px-6 py-4 bg-blue-50 border-y border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-900">AI-Generated Summary</h3>
                </div>
                <p className="text-sm text-blue-800">{video.summary}</p>
              </div>
            )}

            {/* Topics */}
            {video.topics && Array.isArray(video.topics) && video.topics.length > 0 && (
              <div className="px-6 py-4 bg-purple-50 border-b border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Tags className="h-4 w-4 text-purple-600" />
                  <h3 className="text-sm font-semibold text-purple-900">Topics</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {video.topics.map((topic: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full border border-purple-300"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* No AI Enrichment Available Message - only show when truly no content */}
            {video.ingestionStatus === 'ingested' &&
             !video.summary &&
             (!video.topics || !Array.isArray(video.topics) || video.topics.length === 0) &&
             !video.transcriptText &&
             !video.description && (
              <div className="px-6 py-4 bg-orange-50 border-y border-orange-200">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-orange-900 mb-1">AI Enrichment Unavailable</h3>
                    <p className="text-sm text-orange-800">
                      AI-generated summary and topics could not be created because this video has no transcript and no description.
                    </p>
                    <p className="text-xs text-orange-700 mt-2">
                      Add a description to this video on YouTube, then click "Enrich Video" above to generate AI insights.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {video.description && (
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Description</h3>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {video.description}
                </p>
              </div>
            )}

            {/* Transcript */}
            {video.transcriptText && (
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Full Transcript</h3>
                    <span className="text-xs text-gray-500">
                      ({video.transcriptText.length.toLocaleString()} characters)
                    </span>
                  </div>
                  <button
                    onClick={() => setShowFullTranscript(!showFullTranscript)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showFullTranscript ? 'Hide' : 'Show'} Transcript
                  </button>
                </div>
                {showFullTranscript && (
                  <div className="mt-3 p-4 bg-white border border-gray-300 rounded max-h-96 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {video.transcriptText}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* No Transcript Available Message */}
            {!video.transcriptText && (video.transcriptStatus === 'none' || video.transcriptStatus === 'failed') && (
              <div className="px-6 py-4 bg-amber-50 border-y border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-amber-900 mb-1">
                      {video.transcriptStatus === 'failed' ? 'Transcript Unavailable' : 'No Transcript Available'}
                    </h3>
                    <p className="text-sm text-amber-800">
                      {video.transcriptStatus === 'failed'
                        ? 'We attempted to fetch the transcript but encountered an error. This video may not have captions available.'
                        : 'This video does not have an available transcript. Captions may be disabled or unavailable for this video.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Metadata */}
            <div className="px-6 py-4 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Video ID:</span>
                  <p className="font-mono text-xs text-gray-800">{video.youtubeVideoId}</p>
                </div>
                {video.channelId && (
                  <div>
                    <span className="text-gray-600">Channel ID:</span>
                    <p className="font-mono text-xs text-gray-800">{video.channelId}</p>
                  </div>
                )}
                {video.categoryId && (
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <p className="text-gray-800">{video.categoryId}</p>
                  </div>
                )}
                {video.license && (
                  <div>
                    <span className="text-gray-600">License:</span>
                    <p className="text-gray-800">{video.license}</p>
                  </div>
                )}
                {video.madeForKids !== null && video.madeForKids !== undefined && (
                  <div>
                    <span className="text-gray-600">Made for Kids:</span>
                    <p className="text-gray-800">{video.madeForKids ? 'Yes' : 'No'}</p>
                  </div>
                )}
                {video.captionAvailable !== null && video.captionAvailable !== undefined && (
                  <div>
                    <span className="text-gray-600">Captions Available:</span>
                    <p className="text-gray-800">{video.captionAvailable ? 'Yes' : 'No'}</p>
                  </div>
                )}
                {video.capturedAt && (
                  <div>
                    <span className="text-gray-600">Statistics Captured:</span>
                    <p className="text-gray-800">
                      {new Date(video.capturedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {video.lastEnrichedAt && (
                  <div>
                    <span className="text-gray-600">Last Enriched:</span>
                    <p className="text-gray-800">
                      {new Date(video.lastEnrichedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {video.ingestedAt && (
                  <div>
                    <span className="text-gray-600">Ingested:</span>
                    <p className="text-gray-800">
                      {new Date(video.ingestedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Created:</span>
                  <p className="text-gray-800">
                    {new Date(video.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
              <p>No memories linked to this video yet</p>
              <button
                onClick={() => navigate('/app/capture', { state: { youtubeVideoId: video?.id } })}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Memory
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
