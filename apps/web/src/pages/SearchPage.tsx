import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { searchMemories } from '../api/search';
import { getMemories } from '../api/memories';
import { Eye, Search, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useIsMobile } from '../hooks/useIsMobile';
import { BottomSheet } from '../components/mobile/BottomSheet';

export function SearchPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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

  // Search query
  const { data: searchResults, isLoading: searching, isError, refetch: refetchSearch } = useQuery({
    queryKey: ['search', searchTerm],
    queryFn: () => searchMemories(searchTerm),
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

  // Determine what to display
  const data = searchTerm ? searchResults : null;
  const memories = searchTerm ? searchResults?.memories : recentMemories?.slice(0, 5);
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

      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">Search Memories</h1>
      <p className="hidden md:block text-gray-600 mb-6">Find what you're looking for with AI-powered search</p>

      <form onSubmit={handleSubmit} className="mb-4 md:mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 h-12 md:h-auto px-4 py-2 text-base md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isMobile && searchTerm && (
            <button
              type="button"
              onClick={() => setIsFiltersOpen(true)}
              className="min-w-tap h-12 px-3 bg-gray-100 text-gray-700 rounded-md active:bg-gray-200"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          )}
          <button
            type="submit"
            className="min-w-tap h-12 md:h-auto md:px-6 md:py-2 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Search className="h-5 w-5 md:hidden" />
            <span className="hidden md:inline">Search</span>
          </button>
        </div>
      </form>

      {data?.degraded && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-sm text-yellow-700">
            Search is using keyword matching. Some results may be less relevant than usual.
          </p>
        </div>
      )}

      {isLoading && (
        <p className="text-gray-600">
          {searchTerm ? 'Searching...' : 'Loading recent memories...'}
        </p>
      )}
      {isError && <p className="text-red-600">Search failed</p>}

      {/* Results header */}
      {!isLoading && memories && memories.length > 0 && (
        <div className="mb-3 md:mb-4 flex items-center justify-between">
          <p className="text-xs md:text-sm text-gray-600">
            {searchTerm ? (
              <>
                <span className="md:hidden">{data?.totalCount || 0} results</span>
                <span className="hidden md:inline">Found {data?.totalCount || 0} {data?.totalCount === 1 ? 'memory' : 'memories'}</span>
              </>
            ) : (
              <>
                <span className="md:hidden">Recent</span>
                <span className="hidden md:inline">Your recent memories</span>
              </>
            )}
          </p>
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Memory list */}
      {!isLoading && memories && memories.length > 0 && (
        <div className="space-y-3 md:space-y-4">
          {memories.map((memory: any) => (
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
          ))}
        </div>
      )}

      {/* Empty states */}
      {!isLoading && (!memories || memories.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchTerm ? 'No memories found. Try a different search.' : 'No memories yet. Start capturing your thoughts!'}
          </p>
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
            className="w-full h-12 bg-blue-600 text-white rounded-lg font-medium active:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

