import { useState, useEffect } from 'react';
import { AlertCircle, X, Database, CheckCircle } from 'lucide-react';
import { SpellingError } from '../api/memories';
import { addExcludedWord } from '../api/spellCheck';
import { lookupWord } from '../api/admin';

interface SpellCheckIndicatorProps {
  spellingErrors: SpellingError[];
  onAcceptSuggestion: (error: SpellingError, suggestion: string) => void;
  onExcludeWord?: (word: string) => void;
  onSkipWord?: (word: string) => void;
  onAddToDatabase?: (word: string) => void;
}

export function SpellCheckIndicator({
  spellingErrors,
  onAcceptSuggestion,
  onExcludeWord,
  onSkipWord,
  onAddToDatabase,
}: SpellCheckIndicatorProps) {
  const [existingWords, setExistingWords] = useState<Set<string>>(new Set());
  const [checkingWords, setCheckingWords] = useState<Set<string>>(new Set());

  // Check if words already exist in database
  useEffect(() => {
    const checkExistingWords = async () => {
      const wordsToCheck = spellingErrors.map(e => e.word.toLowerCase().trim());
      setCheckingWords(new Set(wordsToCheck));

      const results = await Promise.all(
        wordsToCheck.map(async (word) => {
          try {
            const existing = await lookupWord(word);
            return { word, exists: existing && existing.length > 0 };
          } catch (error) {
            console.error(`Failed to check word "${word}":`, error);
            return { word, exists: false };
          }
        })
      );

      const existingSet = new Set<string>();
      results.forEach(({ word, exists }) => {
        if (exists) {
          existingSet.add(word);
        }
      });

      setExistingWords(existingSet);
      setCheckingWords(new Set());
    };

    if (spellingErrors.length > 0) {
      checkExistingWords();
    }
  }, [spellingErrors]);

  if (spellingErrors.length === 0) {
    return null;
  }

  const handleExcludeWord = async (word: string) => {
    try {
      await addExcludedWord(word);
      if (onExcludeWord) {
        onExcludeWord(word);
      }
    } catch (error) {
      console.error('Failed to exclude word:', error);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-yellow-900 mb-2">
            Possible spelling errors ({spellingErrors.length})
          </h4>
          <div className="space-y-3">
            {spellingErrors.map((error, index) => {
              const normalizedWord = error.word.toLowerCase().trim();
              const wordExists = existingWords.has(normalizedWord);
              const isChecking = checkingWords.has(normalizedWord);

              return (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <span className="font-medium text-yellow-800">
                        "{error.word}"
                      </span>
                      {wordExists && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 border border-green-300 rounded-full">
                          <CheckCircle className="h-3 w-3 text-green-700" />
                          <span className="text-xs text-green-700 font-medium">In database</span>
                        </div>
                      )}
                    </div>
                  {error.suggestions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-gray-600">Did you mean:</span>
                      {error.suggestions.slice(0, 3).map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => onAcceptSuggestion(error, suggestion)}
                          className="text-sm px-2 py-1 bg-white border border-yellow-300 rounded hover:bg-yellow-100 transition-colors text-yellow-900"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 italic">No suggestions</span>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-[88px] flex-wrap">
                  <button
                    onClick={() => onSkipWord?.(error.word)}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Skip this word
                  </button>
                  <button
                    onClick={() => onAddToDatabase?.(error.word)}
                    disabled={isChecking}
                    className="text-xs text-green-600 hover:text-green-800 underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <Database className="h-3 w-3" />
                    {wordExists ? 'View in database' : 'Add to word database'}
                  </button>
                  <button
                    onClick={() => handleExcludeWord(error.word)}
                    className="text-xs text-gray-600 hover:text-gray-900 underline flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Add to excluded words (ignore in future)
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
