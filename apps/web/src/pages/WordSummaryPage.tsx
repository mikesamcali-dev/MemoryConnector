import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllWords, enrichWord, deleteWord, deduplicateWords } from '../api/admin';
import { ArrowLeft, Trash2, Sparkles, Search, Loader, BookOpen, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function WordSummaryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());

  // Fetch all words
  const { data: words, isLoading } = useQuery({
    queryKey: ['admin-words'],
    queryFn: getAllWords,
  });

  // Enrich word mutation
  const enrichMutation = useMutation({
    mutationFn: enrichWord,
    onMutate: (wordId) => {
      setEnrichingIds(prev => new Set(prev).add(wordId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-words'] });
    },
    onSettled: (_data, _error, wordId) => {
      setEnrichingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(wordId);
        return newSet;
      });
    },
  });

  // Delete word mutation
  const deleteMutation = useMutation({
    mutationFn: deleteWord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-words'] });
    },
  });

  // Deduplicate words mutation
  const deduplicateMutation = useMutation({
    mutationFn: deduplicateWords,
    onSuccess: (data) => {
      alert(`Deduplication complete!\nRemoved: ${data.removed} duplicates\nKept: ${data.kept} unique words`);
      queryClient.invalidateQueries({ queryKey: ['admin-words'] });
    },
    onError: (error: any) => {
      alert(`Failed to deduplicate words: ${error.message}`);
    },
  });

  const handleEnrich = (wordId: string) => {
    enrichMutation.mutate(wordId);
  };

  const handleDelete = (wordId: string, wordText: string) => {
    if (confirm(`Are you sure you want to delete the word "${wordText}"? This will also delete the associated memory.`)) {
      deleteMutation.mutate(wordId);
    }
  };

  const handleDeduplicate = () => {
    if (confirm('This will remove all duplicate words, keeping only the oldest entry for each unique word. Continue?')) {
      deduplicateMutation.mutate();
    }
  };

  // Filter words based on search term
  const filteredWords = words?.filter(word =>
    word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Sort words alphabetically
  const sortedWords = [...filteredWords].sort((a, b) => a.word.localeCompare(b.word));

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/app/admin')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Dashboard
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Word Management</h1>
            <p className="text-gray-600 mt-2">
              Manage and enrich vocabulary words ({words?.length || 0} total)
            </p>
          </div>
          <button
            onClick={handleDeduplicate}
            disabled={deduplicateMutation.isPending || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deduplicateMutation.isPending ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                Deduplicating...
              </>
            ) : (
              <>
                <Copy className="h-5 w-5" />
                Remove Duplicates
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search words..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Words Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Word
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part of Speech
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Definition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Enriched
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedWords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {searchTerm ? 'No words found matching your search' : 'No words in the database yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                sortedWords.map((word) => {
                  const isEnriching = enrichingIds.has(word.memoryId);
                  const isDeleting = deleteMutation.isPending;

                  return (
                    <tr key={word.memoryId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {word.word}
                          </div>
                          {word.phonetic && (
                            <div className="ml-2 text-xs text-gray-500">
                              {word.phonetic}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {word.partOfSpeech || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-md truncate">
                          {word.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {word.difficulty && (
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              word.difficulty === 'easy'
                                ? 'bg-green-100 text-green-700'
                                : word.difficulty === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {word.difficulty}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {word.lastEnrichedAt
                          ? new Date(word.lastEnrichedAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEnrich(word.memoryId)}
                            disabled={isEnriching || isDeleting}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Enrich with AI"
                          >
                            {isEnriching ? (
                              <>
                                <Loader className="h-4 w-4 animate-spin" />
                                <span className="text-xs">Enriching...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                <span className="text-xs">Enrich</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(word.memoryId, word.word)}
                            disabled={isEnriching || isDeleting}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete word"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="text-xs">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-600 font-medium">Total Words</div>
          <div className="text-2xl font-bold text-blue-900">{words?.length || 0}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-600 font-medium">Easy Words</div>
          <div className="text-2xl font-bold text-green-900">
            {words?.filter(w => w.difficulty === 'easy').length || 0}
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="text-sm text-yellow-600 font-medium">Medium Words</div>
          <div className="text-2xl font-bold text-yellow-900">
            {words?.filter(w => w.difficulty === 'medium').length || 0}
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="text-sm text-red-600 font-medium">Hard Words</div>
          <div className="text-2xl font-bold text-red-900">
            {words?.filter(w => w.difficulty === 'hard').length || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
