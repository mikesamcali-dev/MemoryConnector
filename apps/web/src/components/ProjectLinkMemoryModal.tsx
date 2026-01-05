import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search, Link as LinkIcon, Image, Film, Video, Link2 } from 'lucide-react';
import { searchMemories } from '../api/search';
import { getMemories } from '../api/memories';
import { linkMemoryToProject } from '../api/projects';

interface ProjectLinkMemoryModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  linkedMemoryIds: string[];
}

type ContentFilter = 'all' | 'images' | 'tiktok' | 'youtube' | 'urls';

export function ProjectLinkMemoryModal({
  projectId,
  projectName,
  isOpen,
  onClose,
  linkedMemoryIds,
}: ProjectLinkMemoryModalProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');

  // Fetch all memories or search results
  const { data: allMemories, isLoading: isLoadingAll } = useQuery({
    queryKey: ['memories-all'],
    queryFn: () => getMemories(0, 100),
    enabled: isOpen && !searchTerm,
  });

  const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['memory-search', searchTerm],
    queryFn: () => searchMemories(searchTerm),
    enabled: isOpen && !!searchTerm,
  });

  const isLoading = searchTerm ? isLoadingSearch : isLoadingAll;
  const memories = searchTerm ? searchResults?.memories : allMemories;

  const linkMutation = useMutation({
    mutationFn: (memoryId: string) => linkMemoryToProject(projectId, memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  const handleLink = (memoryId: string) => {
    linkMutation.mutate(memoryId);
  };

  if (!isOpen) return null;

  // Filter results based on content type
  const filteredResults = memories?.filter((memory: any) => {
    if (contentFilter === 'all') return true;
    if (contentFilter === 'images') return !!memory.imageId;
    if (contentFilter === 'tiktok') return !!memory.tiktokVideoId;
    if (contentFilter === 'youtube') return !!memory.youtubeVideoId;
    if (contentFilter === 'urls') return !!memory.urlPageId;
    return true;
  }) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <LinkIcon className="h-6 w-6 text-blue-600" />
              Link Memories to Project
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Add memories to "{projectName}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search memories..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Content Type Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setContentFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                contentFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setContentFilter('images')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                contentFilter === 'images'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Image className="h-3 w-3" />
              Images
            </button>
            <button
              onClick={() => setContentFilter('tiktok')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                contentFilter === 'tiktok'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Film className="h-3 w-3" />
              TikTok
            </button>
            <button
              onClick={() => setContentFilter('youtube')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                contentFilter === 'youtube'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Video className="h-3 w-3" />
              YouTube
            </button>
            <button
              onClick={() => setContentFilter('urls')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                contentFilter === 'urls'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Link2 className="h-3 w-3" />
              URLs
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Loading memories...</p>
            </div>
          )}

          {!isLoading && filteredResults.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No memories found</p>
              {searchTerm && (
                <p className="text-sm text-gray-500 mt-2">Try a different search term</p>
              )}
            </div>
          )}

          {!isLoading && filteredResults.length > 0 && (
            <div className="space-y-3">
              {filteredResults.map((memory: any) => {
                const isLinked = linkedMemoryIds.includes(memory.id);

                return (
                  <div
                    key={memory.id}
                    className={`p-4 border rounded-lg transition-all ${
                      isLinked
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 line-clamp-2 mb-2">
                          {memory.body || memory.textContent || 'Untitled memory'}
                        </p>

                        {/* Media indicators */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {memory.imageId && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                              <Image className="h-3 w-3" />
                              Image
                            </span>
                          )}
                          {memory.tiktokVideoId && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs">
                              <Film className="h-3 w-3" />
                              TikTok
                            </span>
                          )}
                          {memory.youtubeVideoId && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                              <Video className="h-3 w-3" />
                              YouTube
                            </span>
                          )}
                          {memory.urlPageId && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                              <Link2 className="h-3 w-3" />
                              URL
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-500">
                          {new Date(memory.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => handleLink(memory.id)}
                        disabled={isLinked || linkMutation.isPending}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                          isLinked
                            ? 'bg-green-600 text-white cursor-default'
                            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
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
            {linkedMemoryIds.length} {linkedMemoryIds.length === 1 ? 'memory' : 'memories'} linked
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
