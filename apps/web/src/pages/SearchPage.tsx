import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { searchMemories } from '../api/search';
import { getMemories } from '../api/memories';
import { Eye } from 'lucide-react';

export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch recent memories on load
  const { data: recentMemories, isLoading: loadingRecent } = useQuery({
    queryKey: ['recent-memories'],
    queryFn: () => getMemories(),
    enabled: !searchTerm, // Only fetch when not searching
  });

  // Search query
  const { data: searchResults, isLoading: searching, isError } = useQuery({
    queryKey: ['search', searchTerm],
    queryFn: () => searchMemories(searchTerm),
    enabled: searchTerm.length > 0,
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Memories</h1>
      <p className="text-gray-600 mb-6">Find what you're looking for with AI-powered search</p>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your memories..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
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
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {searchTerm ? (
              <>Found {data?.totalCount || 0} {data?.totalCount === 1 ? 'memory' : 'memories'}</>
            ) : (
              <>Your recent memories</>
            )}
          </p>
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Memory list */}
      {!isLoading && memories && memories.length > 0 && (
        <div className="space-y-4">
          {memories.map((memory: any) => (
            <div
              key={memory.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
              onClick={() => navigate(`/app/memories/${memory.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-gray-900 flex-1 line-clamp-2">{memory.textContent}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/app/memories/${memory.id}`);
                  }}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-full"
                  title="View details"
                >
                  <Eye className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
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
    </div>
  );
}

