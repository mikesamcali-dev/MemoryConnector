import { useState } from 'react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { searchAll } from '../api/search';
import { getMemories, deleteMemory } from '../api/memories';
import {
  Eye,
  Search,
  RefreshCw,
  SlidersHorizontal,
  Brain,
  FolderKanban,
  Image as ImageIcon,
  Link as LinkIcon,
  Video,
  Film,
  User,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useIsMobile } from '../hooks/useIsMobile';
import { useHaptics } from '../hooks/useHaptics';
import { BottomSheet } from '../components/mobile/BottomSheet';
import { SwipeableMemoryCard } from '../components/SwipeableMemoryCard';

export function SearchPage() {
    const helpPopup = useHelpPopup('search');
const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { haptic } = useHaptics();
  const queryClient = useQueryClient();
  const helpPopup = useHelpPopup('search');
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');

  // Fetch recent memories on load
  const { data: recentMemories, isLoading: loadingRecent, refetch: refetchRecent } = useQuery({
    queryKey: ['recent-memories'],
    queryFn: () => getMemories(),
    enabled: !searchTerm, // Only fetch when not searching
  });

  // Search query - now searches across all entity types
  const { data: searchResults, isLoading: searching, isError, refetch: refetchSearch } = useQuery({
    queryKey: ['search-all', searchTerm],
    queryFn: () => searchAll(searchTerm, 5),
    enabled: searchTerm.length > 0,
  });

  // Pull-to-refresh
  const { isPulling, isRefreshing, pullDistance, handleTouchStart, handleTouchMove, handleTouchEnd } =
    usePullToRefresh({
      onRefresh: async () => {
        if (searchTerm) {
          await refetchSearch();
        } else {
          await refetchRecent();
        }
      },
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(query);
  };

  const handleClearSearch = () => {
    setQuery('');
    setSearchTerm('');
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMemory,
    onSuccess: () => {
      haptic('success');
      queryClient.invalidateQueries({ queryKey: ['recent-memories'] });
      queryClient.invalidateQueries({ queryKey: ['search', searchTerm] });
    },
    onError: () => {
      haptic('error');
      alert('Failed to delete memory');
    },
  });

  // Archive mutation (update memory state to archived)
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      // For now, archive just means delete (can be changed to update state later)
      await deleteMemory(id);
    },
    onSuccess: () => {
      haptic('success');
      queryClient.invalidateQueries({ queryKey: ['recent-memories'] });
      queryClient.invalidateQueries({ queryKey: ['search', searchTerm] });
    },
    onError: () => {
      haptic('error');
      alert('Failed to archive memory');
    },
  });

  // Determine what to display
  const isLoading = searchTerm ? searching : loadingRecent;

  return (
    <div
      className="max-w-4xl mx-auto relative"
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
      data-scroll-container
    >
      {/* Pull-to-refresh indicator */}
      {isMobile && (isPulling || isRefreshing) && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 transition-all"
          style={{
            transform: `translate(-50%, ${Math.min(pullDistance - 40, 20)}px)`,
            opacity: Math.min(pullDistance / 80, 1)
          }}
        >
          <RefreshCw
            className={`h-6 w-6 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </div>
      )}

      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">Search</h1>
      <p className="hidden md:block text-gray-600 mb-6">Find memories, projects, images, videos, people, locations, and more</p>

      <form onSubmit={handleSubmit} className="mb-4 md:mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 h-12 md:h-10 px-4 md:px-3 py-2 text-base md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isMobile && searchTerm && (
            <button
              type="button"
              onClick={() => setIsFiltersOpen(true)}
              className="min-w-[48px] min-h-[48px] h-12 px-3 bg-gray-100 text-gray-700 rounded-md active:bg-gray-200 flex items-center justify-center"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          )}
          <button
            type="submit"
            className="min-w-[48px] min-h-[48px] h-12 md:h-10 md:px-4 md:py-2 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
          >
            <Search className="h-5 w-5 md:h-4 md:w-4 md:hidden" />
            <span className="hidden md:inline">Search</span>
          </button>
        </div>
      </form>

      {/* Degraded search warning */}
      {searchResults?.memories.degraded && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-sm text-yellow-700">
            Search is using keyword matching. Some results may be less relevant than usual.
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <p className="text-gray-600">
          {searchTerm ? 'Searching...' : 'Loading recent memories...'}
        </p>
      )}

      {/* Error state */}
      {isError && <p className="text-red-600">Search failed</p>}

      {/* Recent memories (when not searching) */}
      {!searchTerm && !isLoading && recentMemories && recentMemories.length > 0 && (
        <div className="space-y-3 md:space-y-4">
          <div className="mb-3 md:mb-4">
            <p className="text-xs md:text-sm text-gray-600">
              <span className="md:hidden">Recent</span>
              <span className="hidden md:inline">Your recent memories</span>
            </p>
          </div>
          {recentMemories.slice(0, 5).map((memory: any) => (
            isMobile ? (
              <SwipeableMemoryCard
                key={memory.id}
                memory={memory}
                onDelete={(id) => deleteMutation.mutate(id)}
                onArchive={(id) => archiveMutation.mutate(id)}
              />
            ) : (
              <div
                key={memory.id}
                className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group active:bg-gray-50"
                onClick={() => navigate(`/app/memories/${memory.id}`)}
              >
                <div className="flex items-start justify-between gap-2 md:gap-4">
                  <p className="text-sm md:text-base text-gray-900 flex-1 line-clamp-2">{memory.textContent}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/app/memories/${memory.id}`);
                    }}
                    className="hidden md:flex flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-full"
                    title="View details"
                  >
                    <Eye className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
                <div className="flex items-center gap-2 md:gap-4 mt-2 md:mt-3 text-xs text-gray-500">
                  <span>{new Date(memory.createdAt).toLocaleDateString()}</span>
                  {memory.type && (
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                      {memory.type}
                    </span>
                  )}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Search Results - Unified across all entity types */}
      {searchTerm && !isLoading && searchResults && (
        <div className="space-y-4 md:space-y-6">
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Found {searchResults.totalResults} results across multiple categories
            </p>
            <button
              onClick={handleClearSearch}
              className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear
            </button>
          </div>

          {/* Memories Section */}
          {searchResults.memories.count > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-5 w-5 text-blue-600" />
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  Memories ({searchResults.memories.count})
                </h3>
              </div>
              <div className="space-y-2">
                {searchResults.memories.results.map((memory: any) => (
                  <div
                    key={memory.id}
                    onClick={() => navigate(`/app/memories/${memory.id}`)}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <p className="text-sm text-gray-900 line-clamp-2">{memory.textContent}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(memory.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects Section */}
          {searchResults.projects.count > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-3">
                <FolderKanban className="h-5 w-5 text-teal-600" />
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  Projects ({searchResults.projects.count})
                </h3>
              </div>
              <div className="space-y-2">
                {searchResults.projects.results.map((project: any) => (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/app/projects/${project.id}`)}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <p className="font-medium text-gray-900">{project.name}</p>
                    {project.description && (
                      <p className="text-sm text-gray-600 line-clamp-1 mt-1">{project.description}</p>
                    )}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {project.tags.slice(0, 3).map((tag: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Images Section */}
          {searchResults.images.count > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="h-5 w-5 text-purple-600" />
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  Images ({searchResults.images.count})
                </h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {searchResults.images.results.map((image: any) => (
                  <div
                    key={image.id}
                    onClick={() => navigate(`/app/images`)}
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-purple-500"
                  >
                    <img
                      src={image.thumbnailUrl256 || image.storageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* URL Pages Section */}
          {searchResults.urlPages.count > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-3">
                <LinkIcon className="h-5 w-5 text-green-600" />
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  URLs ({searchResults.urlPages.count})
                </h3>
              </div>
              <div className="space-y-2">
                {searchResults.urlPages.results.map((urlPage: any) => (
                  <a
                    key={urlPage.id}
                    href={urlPage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <p className="font-medium text-gray-900 line-clamp-1">
                      {urlPage.title || 'Untitled'}
                    </p>
                    <p className="text-sm text-blue-600 truncate mt-1 flex items-center gap-1">
                      {urlPage.url}
                      <ExternalLink className="h-3 w-3" />
                    </p>
                    {urlPage.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                        {urlPage.description}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* YouTube Videos Section */}
          {searchResults.youtubeVideos.count > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-3">
                <Video className="h-5 w-5 text-red-600" />
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  YouTube Videos ({searchResults.youtubeVideos.count})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {searchResults.youtubeVideos.results.map((video: any) => (
                  <div
                    key={video.id}
                    onClick={() =>
                      window.open(`https://youtube.com/watch?v=${video.youtubeVideoId}`, '_blank')
                    }
                    className="cursor-pointer hover:shadow-md transition-shadow rounded-lg overflow-hidden border border-gray-200"
                  >
                    <div className="aspect-video bg-gray-900">
                      <img
                        src={
                          video.thumbnailUrl ||
                          `https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`
                        }
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{video.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{video.creatorDisplayName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TikTok Videos Section */}
          {searchResults.tiktokVideos.count > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-3">
                <Film className="h-5 w-5 text-pink-600" />
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  TikTok Videos ({searchResults.tiktokVideos.count})
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {searchResults.tiktokVideos.results.map((video: any) => (
                  <div
                    key={video.id}
                    className="cursor-pointer hover:shadow-md transition-shadow rounded-lg overflow-hidden border border-gray-200"
                  >
                    <div className="aspect-[9/16] bg-gray-900">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="h-12 w-12 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{video.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{video.creatorDisplayName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* People Section */}
          {searchResults.people.count > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  People ({searchResults.people.count})
                </h3>
              </div>
              <div className="space-y-2">
                {searchResults.people.results.map((person: any) => (
                  <div
                    key={person.id}
                    onClick={() => navigate(`/app/people/${person.id}`)}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <p className="font-medium text-gray-900">{person.displayName}</p>
                    {(person.email || person.phone) && (
                      <p className="text-sm text-gray-600 mt-1">
                        {person.email || person.phone}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locations Section */}
          {searchResults.locations.count > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-orange-600" />
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  Locations ({searchResults.locations.count})
                </h3>
              </div>
              <div className="space-y-2">
                {searchResults.locations.results.map((location: any) => (
                  <div
                    key={location.id}
                    onClick={() => navigate(`/app/locations/${location.id}`)}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <p className="font-medium text-gray-900">{location.name}</p>
                    {(location.address || location.city) && (
                      <p className="text-sm text-gray-600 mt-1">
                        {[location.address, location.city, location.state, location.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {searchResults.totalResults === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No results found. Try a different search term.</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state (no recent memories and not searching) */}
      {!searchTerm && !isLoading && (!recentMemories || recentMemories.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500">No memories yet. Start capturing your thoughts!</p>
        </div>
      )}

      {/* Filters BottomSheet (mobile only) */}
      <BottomSheet
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        title="Search Options"
      >
        <div className="space-y-6 p-4">
          {/* Sort By */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Sort By</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer active:bg-gray-50">
                <input
                  type="radio"
                  name="sortBy"
                  value="relevance"
                  checked={sortBy === 'relevance'}
                  onChange={(e) => setSortBy(e.target.value as 'relevance')}
                  className="w-5 h-5 text-blue-600"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Relevance</div>
                  <div className="text-xs text-gray-500">Best matches first</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer active:bg-gray-50">
                <input
                  type="radio"
                  name="sortBy"
                  value="date"
                  checked={sortBy === 'date'}
                  onChange={(e) => setSortBy(e.target.value as 'date')}
                  className="w-5 h-5 text-blue-600"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Date</div>
                  <div className="text-xs text-gray-500">Most recent first</div>
                </div>
              </label>
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={() => setIsFiltersOpen(false)}
            className="w-full h-12 px-4 py-2 bg-blue-600 text-white text-base rounded-lg font-medium active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Apply
          </button>
        </div>
      </BottomSheet>

      {/* Help Popup */}
      <HelpPopup
        pageKey="search"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />
    </div>
  );
}

