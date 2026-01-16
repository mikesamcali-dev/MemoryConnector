import { useState } from 'react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useQuery } from '@tanstack/react-query';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useNavigate } from 'react-router-dom';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { getAllWords } from '../api/words';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { BookOpen, Search, ArrowLeft } from 'lucide-react';

import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
export function WordsPage() {
    const helpPopup = useHelpPopup('words');
const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: words, isLoading, isError } = useQuery({
    queryKey: ['words'],
    queryFn: getAllWords,
  });

  const filteredWords = words?.filter((word) =>
    word.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading words...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <p className="text-red-600 text-center mb-4">Failed to load words</p>
          <button
            onClick={() => navigate('/app')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/app')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </button>
          </div>
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Words & Phrases</h1>
              <p className="text-gray-600">Browse and explore your vocabulary</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search words..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Words</p>
              <p className="text-2xl font-bold text-blue-900">{words?.length || 0}</p>
            </div>
            {searchTerm && (
              <div>
                <p className="text-sm text-blue-600 font-medium">Search Results</p>
                <p className="text-2xl font-bold text-blue-900">{filteredWords?.length || 0}</p>
              </div>
            )}
          </div>
        </div>

        {/* Words Grid */}
        {filteredWords && filteredWords.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredWords.map((word) => (
              <button
                key={word.id}
                onClick={() => navigate(`/app/words/${word.id}`)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex-1 break-words">
                    {word.word}
                  </h3>
                  <BookOpen className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-2" />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{word.count} {word.count === 1 ? 'memory' : 'memories'}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">
              {searchTerm ? 'No words found' : 'No words yet'}
            </p>
            <p className="text-gray-500 text-sm">
              {searchTerm
                ? 'Try a different search term'
                : 'Words will appear here as you create memories'}
            </p>
          </div>
        )}
      </div>
      {/* Help Popup */}
      <HelpPopup
        pageKey="words"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}