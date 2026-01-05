import { useState, useEffect } from 'react';
import { X, Save, Loader } from 'lucide-react';

interface Word {
  id?: string;
  word: string;
  description: string | null;
  phonetic: string | null;
  partOfSpeech: string | null;
  etymology: string | null;
  examples: string[] | null;
  synonyms: string[] | null;
  antonyms: string[] | null;
  difficulty: string | null;
}

interface WordEditModalProps {
  word?: Word | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Word>) => void;
  isSaving: boolean;
}

export function WordEditModal({ word, isOpen, onClose, onSave, isSaving }: WordEditModalProps) {
  const [formData, setFormData] = useState<Partial<Word>>({
    word: '',
    description: '',
    phonetic: '',
    partOfSpeech: '',
    etymology: '',
    examples: [],
    synonyms: [],
    antonyms: [],
    difficulty: 'medium',
  });

  const [examplesText, setExamplesText] = useState('');
  const [synonymsText, setSynonymsText] = useState('');
  const [antonymsText, setAntonymsText] = useState('');

  useEffect(() => {
    if (word) {
      setFormData({
        word: word.word || '',
        description: word.description || '',
        phonetic: word.phonetic || '',
        partOfSpeech: word.partOfSpeech || '',
        etymology: word.etymology || '',
        examples: word.examples || [],
        synonyms: word.synonyms || [],
        antonyms: word.antonyms || [],
        difficulty: word.difficulty || 'medium',
      });
      setExamplesText(word.examples?.join('\n') || '');
      setSynonymsText(word.synonyms?.join(', ') || '');
      setAntonymsText(word.antonyms?.join(', ') || '');
    } else {
      setFormData({
        word: '',
        description: '',
        phonetic: '',
        partOfSpeech: '',
        etymology: '',
        examples: [],
        synonyms: [],
        antonyms: [],
        difficulty: 'medium',
      });
      setExamplesText('');
      setSynonymsText('');
      setAntonymsText('');
    }
  }, [word]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const examples = examplesText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const synonyms = synonymsText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const antonyms = antonymsText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    onSave({
      ...formData,
      examples: examples.length > 0 ? examples : null,
      synonyms: synonyms.length > 0 ? synonyms : null,
      antonyms: antonyms.length > 0 ? antonyms : null,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {word ? 'Edit Word' : 'Create Word'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isSaving}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Word (only for create) */}
          {!word && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Word / Phrase <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.word}
                onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter word or phrase"
                required
                disabled={isSaving}
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Clear, concise definition"
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Phonetic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phonetic
              </label>
              <input
                type="text"
                value={formData.phonetic || ''}
                onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="/fəˈnetɪk/"
                disabled={isSaving}
              />
            </div>

            {/* Part of Speech */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Part of Speech
              </label>
              <select
                value={formData.partOfSpeech || ''}
                onChange={(e) => setFormData({ ...formData, partOfSpeech: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSaving}
              >
                <option value="">Select...</option>
                <option value="noun">Noun</option>
                <option value="verb">Verb</option>
                <option value="adjective">Adjective</option>
                <option value="adverb">Adverb</option>
                <option value="pronoun">Pronoun</option>
                <option value="preposition">Preposition</option>
                <option value="conjunction">Conjunction</option>
                <option value="interjection">Interjection</option>
                <option value="phrase">Phrase</option>
              </select>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              value={formData.difficulty || 'medium'}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSaving}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Etymology */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etymology
            </label>
            <textarea
              value={formData.etymology || ''}
              onChange={(e) => setFormData({ ...formData, etymology: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Origin and history of the word"
              disabled={isSaving}
            />
          </div>

          {/* Examples */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Examples
              <span className="text-xs text-gray-500 ml-2">(one per line)</span>
            </label>
            <textarea
              value={examplesText}
              onChange={(e) => setExamplesText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows={4}
              placeholder="The quick brown fox jumps over the lazy dog.&#10;She sells seashells by the seashore."
              disabled={isSaving}
            />
          </div>

          {/* Synonyms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Synonyms
              <span className="text-xs text-gray-500 ml-2">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={synonymsText}
              onChange={(e) => setSynonymsText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="happy, joyful, cheerful"
              disabled={isSaving}
            />
          </div>

          {/* Antonyms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Antonyms
              <span className="text-xs text-gray-500 ml-2">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={antonymsText}
              onChange={(e) => setAntonymsText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="sad, unhappy, miserable"
              disabled={isSaving}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || (!word && !formData.word)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {word ? 'Update Word' : 'Create Word'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
