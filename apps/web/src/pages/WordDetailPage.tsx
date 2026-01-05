import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getWordById } from '../api/words';
import { ArrowLeft, BookOpen, Volume2, Tag, Clock, FileText, ExternalLink } from 'lucide-react';

export function WordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: word, isLoading, isError } = useQuery({
    queryKey: ['word', id],
    queryFn: () => getWordById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading word...</p>
        </div>
      </div>
    );
  }

  if (isError || !word) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <p className="text-red-600 text-center mb-4">Word not found</p>
          <button
            onClick={() => navigate('/app/words')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Words
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/app/words')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Words
          </button>
        </div>

        {/* Word Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{word.word}</h1>
                {word.phonetic && (
                  <div className="flex items-center gap-2 text-blue-100">
                    <Volume2 className="h-4 w-4" />
                    <span className="text-lg">{word.phonetic}</span>
                  </div>
                )}
              </div>
              <BookOpen className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Part of Speech & Difficulty */}
            {(word.partOfSpeech || word.difficulty) && (
              <div className="flex flex-wrap gap-2">
                {word.partOfSpeech && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {word.partOfSpeech}
                  </span>
                )}
                {word.difficulty && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    word.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    word.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {word.difficulty}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {word.description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Definition
                </h2>
                <p className="text-gray-700 leading-relaxed">{word.description}</p>
              </div>
            )}

            {/* Etymology */}
            {word.etymology && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Etymology
                </h2>
                <p className="text-gray-700 leading-relaxed">{word.etymology}</p>
              </div>
            )}

            {/* Examples */}
            {word.examples && word.examples.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Examples
                </h2>
                <ul className="space-y-2">
                  {word.examples.map((example, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span className="text-gray-700 italic">{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Synonyms & Antonyms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {word.synonyms && word.synonyms.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Tag className="h-5 w-5 text-green-600" />
                    Synonyms
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {word.synonyms.map((synonym, index) => (
                      <span key={index} className="px-2 py-1 bg-green-50 text-green-700 rounded text-sm">
                        {synonym}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {word.antonyms && word.antonyms.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Tag className="h-5 w-5 text-red-600" />
                    Antonyms
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {word.antonyms.map((antonym, index) => (
                      <span key={index} className="px-2 py-1 bg-red-50 text-red-700 rounded text-sm">
                        {antonym}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Linked Memories */}
            {word.memoryLinks && word.memoryLinks.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-blue-600" />
                  Linked Memories ({word.memoryLinks.length})
                </h2>
                <div className="space-y-2">
                  {word.memoryLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => navigate(`/app/memories/${link.memory.id}`)}
                      className="w-full p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-left transition-colors"
                    >
                      <p className="text-gray-900 line-clamp-2">{link.memory.body}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(link.memory.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Link Memory Button */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3 text-center">
                To link a memory to this word, search for the memory and click "Link" from its detail page, then select "Word" and choose "{word.word}".
              </p>
              <button
                onClick={() => navigate('/app/search')}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-5 w-5" />
                Go to Search
              </button>
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
              <p>Created: {new Date(word.createdAt).toLocaleString()}</p>
              {word.lastEnrichedAt && (
                <p>Last enriched: {new Date(word.lastEnrichedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
