import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchMemories } from '../api/search';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['search', searchTerm],
    queryFn: () => searchMemories(searchTerm),
    enabled: searchTerm.length > 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(query);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Search Memories</h1>

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

      {isLoading && <p>Searching...</p>}
      {isError && <p className="text-red-600">Search failed</p>}

      {data && (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Found {data.totalCount} {data.totalCount === 1 ? 'memory' : 'memories'}
          </p>
          <div className="space-y-4">
            {data.memories.map((memory: any) => (
              <div key={memory.id} className="border rounded-lg p-4">
                <p className="text-gray-900">{memory.textContent}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(memory.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

