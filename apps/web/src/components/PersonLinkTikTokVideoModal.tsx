import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search, Film } from 'lucide-react';
import { getAllTikTokVideos } from '../api/tiktok';
import { linkTikTokVideoToPerson } from '../api/people';

interface PersonLinkTikTokVideoModalProps {
  personId: string;
  personName: string;
  isOpen: boolean;
  onClose: () => void;
  linkedTikTokVideoIds: string[];
}

export function PersonLinkTikTokVideoModal({
  personId,
  personName,
  isOpen,
  onClose,
  linkedTikTokVideoIds,
}: PersonLinkTikTokVideoModalProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all TikTok videos
  const { data: tiktokVideos, isLoading } = useQuery({
    queryKey: ['tiktok-videos-all'],
    queryFn: () => getAllTikTokVideos(0, 100),
    enabled: isOpen,
  });

  const linkMutation = useMutation({
    mutationFn: (tiktokVideoId: string) => linkTikTokVideoToPerson(personId, tiktokVideoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person', personId] });
    },
  });

  const handleLink = (tiktokVideoId: string) => {
    linkMutation.mutate(tiktokVideoId);
  };

  if (!isOpen) return null;

  // Filter by search term
  const filteredVideos = tiktokVideos?.filter((video: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      video.title?.toLowerCase().includes(searchLower) ||
      video.creatorDisplayName?.toLowerCase().includes(searchLower) ||
      video.description?.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Film className="h-6 w-6 text-pink-600" />
              Link TikTok Videos to Person
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Add TikTok videos to "{personName}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search TikTok videos by title or creator..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Loading TikTok videos...</p>
            </div>
          )}

          {!isLoading && filteredVideos.length === 0 && (
            <div className="text-center py-12">
              <Film className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No TikTok videos found</p>
              {searchTerm && (
                <p className="text-sm text-gray-500 mt-2">Try a different search term</p>
              )}
            </div>
          )}

          {!isLoading && filteredVideos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredVideos.map((video: any) => {
                const isLinked = linkedTikTokVideoIds.includes(video.id);
                const thumbnailUrl = video.thumbnailUrl;

                return (
                  <div
                    key={video.id}
                    className={`group rounded-lg overflow-hidden border-2 transition-all ${
                      isLinked
                        ? 'border-green-500 ring-2 ring-green-200'
                        : 'border-gray-200 hover:border-pink-400 hover:shadow-md'
                    }`}
                  >
                    <div className="aspect-[9/16] relative bg-gray-900">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={video.title || 'TikTok video'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="h-12 w-12 text-gray-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-pink-600 rounded-full p-3 opacity-80">
                          <Film className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      {isLinked && (
                        <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-white">
                      <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
                        {video.title || 'Untitled video'}
                      </h3>
                      {video.creatorDisplayName && (
                        <p className="text-xs text-gray-600 mb-2">@{video.creatorDisplayName}</p>
                      )}
                      <button
                        onClick={() => handleLink(video.id)}
                        disabled={isLinked || linkMutation.isPending}
                        className={`w-full px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          isLinked
                            ? 'bg-green-600 text-white cursor-default'
                            : 'bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50'
                        }`}
                      >
                        {isLinked ? 'Linked ✓' : 'Link'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {linkedTikTokVideoIds.length} {linkedTikTokVideoIds.length === 1 ? 'video' : 'videos'} linked
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
