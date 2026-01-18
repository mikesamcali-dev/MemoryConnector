import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllWords,
  createWord,
  updateWord,
  deleteWord,
  enrichWord,
} from '../api/admin';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Sparkles,
  Database,
  Users,
  Loader,
  ArrowLeft,
} from 'lucide-react';
import { WordEditModal } from '../components/admin/WordEditModal';
import { useNavigate } from 'react-router-dom';

export function WordsManagementPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<any | null>(null);

  // Fetch all words
  const { data: words, isLoading: wordsLoading } = useQuery({
    queryKey: ['admin-words'],
    queryFn: getAllWords,
  });

  // Word mutations
  const createWordMutation = useMutation({
    mutationFn: (wordText: string) => createWord(wordText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-words'] });
      setIsWordModalOpen(false);
      setEditingWord(null);
      alert('Word created and enriched successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to create word: ${error.message}`);
    },
  });

  const updateWordMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateWord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-words'] });
      setIsWordModalOpen(false);
      setEditingWord(null);
      alert('Word updated successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to update word: ${error.message}`);
    },
  });

  const enrichWordMutation = useMutation({
    mutationFn: (id: string) => enrichWord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-words'] });
      alert('Word re-enriched successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to re-enrich word: ${error.message}`);
    },
  });

  const deleteWordMutation = useMutation({
    mutationFn: (id: string) => deleteWord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-words'] });
      alert('Word deleted successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to delete word: ${error.message}`);
    },
  });

  const handleCreateWord = () => {
    setEditingWord(null);
    setIsWordModalOpen(true);
  };

  const handleEditWord = (word: any) => {
    setEditingWord(word);
    setIsWordModalOpen(true);
  };

  const handleSaveWord = (data: any) => {
    if (editingWord) {
      // Update existing word
      updateWordMutation.mutate({ id: editingWord.id, data });
    } else {
      // Create new word
      if (data.word) {
        createWordMutation.mutate(data.word);
      }
    }
  };

  const handleDeleteWord = (id: string, word: string) => {
    if (confirm(`Are you sure you want to delete "${word}"? This will remove it from all memories.`)) {
      deleteWordMutation.mutate(id);
    }
  };

  const handleEnrichWord = (id: string, word: string) => {
    if (confirm(`Re-enrich "${word}" with OpenAI? This will update the definition, examples, and other details.`)) {
      enrichWordMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/app/admin')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Words Management</h1>
            <p className="text-gray-600">Create, edit, and manage vocabulary words</p>
          </div>
          <button
            onClick={handleCreateWord}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Word
          </button>
        </div>
      </div>

      {/* Words List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="overflow-x-auto">
          {wordsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : !words || words.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No words found</p>
              <button
                onClick={handleCreateWord}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mx-auto"
              >
                <Plus className="h-4 w-4" />
                Create Your First Word
              </button>
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Total words: <span className="font-semibold">{words.length}</span>
                </p>
              </div>
              <div className="space-y-4">
                {words.map((word: any) => (
                  <div
                    key={word.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{word.word}</h3>
                        {word.phonetic && (
                          <p className="text-sm text-gray-500">{word.phonetic}</p>
                        )}
                        {word.description && (
                          <p className="text-sm text-gray-700 mt-1">{word.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {word.partOfSpeech && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {word.partOfSpeech}
                          </span>
                        )}
                        {word.difficulty && (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            word.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            word.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {word.difficulty}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Database className="h-4 w-4" />
                        <span>{word.memoryCount} {word.memoryCount === 1 ? 'memory' : 'memories'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{word.userCount} {word.userCount === 1 ? 'user' : 'users'}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Created {new Date(word.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {word.users && word.users.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Used by:</p>
                        <div className="flex flex-wrap gap-2">
                          {word.users.map((user: any) => (
                            <div
                              key={user.userId}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              <span>{user.email}</span>
                              <span className="text-gray-500">({user.count})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                      <button
                        onClick={() => handleEditWord(word)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleEnrichWord(word.id, word.word)}
                        disabled={enrichWordMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Re-enrich
                      </button>
                      <button
                        onClick={() => handleDeleteWord(word.id, word.word)}
                        disabled={deleteWordMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Word Edit Modal */}
      <WordEditModal
        word={editingWord}
        isOpen={isWordModalOpen}
        onClose={() => {
          setIsWordModalOpen(false);
          setEditingWord(null);
        }}
        onSave={handleSaveWord}
        isSaving={createWordMutation.isPending || updateWordMutation.isPending}
      />
    </div>
  );
}
