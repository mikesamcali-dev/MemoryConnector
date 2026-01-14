import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Presentation, Trash2, Eye, Plus, Edit2, Check, X } from 'lucide-react';
import {
  getAllSlideDecks,
  updateSlideDeck,
  deleteSlideDeck,
} from '../api/slidedecks';
import { format } from 'date-fns';

export function SlideDecksListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Fetch slide decks
  const {
    data: slideDecks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['slidedecks'],
    queryFn: getAllSlideDecks,
  });

  // Update slide deck mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      updateSlideDeck(id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slidedecks'] });
      setEditingId(null);
      setEditTitle('');
    },
    onError: () => {
      alert('Failed to update slide deck');
    },
  });

  // Delete slide deck mutation
  const deleteMutation = useMutation({
    mutationFn: deleteSlideDeck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slidedecks'] });
      setDeleteConfirmId(null);
    },
    onError: () => {
      alert('Failed to delete slide deck');
    },
  });

  const handleCreate = () => {
    navigate('/app/slidedecks/select-reminders');
  };

  const handleView = (id: string) => {
    navigate(`/app/slidedecks/${id}/view`);
  };

  const handleStartEdit = (id: string, currentTitle: string | null) => {
    setEditingId(id);
    setEditTitle(currentTitle || '');
  };

  const handleSaveEdit = (id: string) => {
    updateMutation.mutate({ id, title: editTitle });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) {
      deleteMutation.mutate(id);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading slide decks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load slide decks</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <Presentation className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Slide Decks</h1>
          </div>
          <button
            onClick={handleCreate}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Create from Reminders</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
        <p className="text-gray-600 mt-2 text-sm md:text-base">
          Review your memories in a slideshow format
        </p>
      </div>

      {/* Slide Decks List */}
      {!slideDecks || slideDecks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Presentation className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
            No slide decks yet
          </h3>
          <p className="text-sm md:text-base text-gray-500 mb-4 px-4">
            Create a slide deck from your overdue reminders to get started
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slides
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {slideDecks.map((deck) => (
                  <tr key={deck.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(deck.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {deck.slideCount} {deck.slideCount === 1 ? 'slide' : 'slides'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {editingId === deck.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(deck.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter title..."
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(deck.id)}
                          disabled={updateMutation.isPending}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={deck.title ? 'text-gray-900' : 'italic text-gray-400'}>
                          {deck.title || 'Untitled'}
                        </span>
                        <button
                          onClick={() => handleStartEdit(deck.id, deck.title)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit title"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(deck.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleDelete(deck.id)}
                        disabled={deleteMutation.isPending}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded transition-colors ${
                          deleteConfirmId === deck.id
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>
                          {deleteConfirmId === deck.id ? 'Confirm?' : 'Delete'}
                        </span>
                      </button>
                    </div>
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {slideDecks.map((deck) => (
              <div key={deck.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      {format(new Date(deck.createdAt), 'MMM d, yyyy')}
                    </div>
                    {editingId === deck.id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(deck.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter title..."
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(deck.id)}
                          disabled={updateMutation.isPending}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className={`text-base font-medium ${deck.title ? 'text-gray-900' : 'italic text-gray-400'}`}>
                          {deck.title || 'Untitled'}
                        </h3>
                        <button
                          onClick={() => handleStartEdit(deck.id, deck.title)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {deck.slideCount} {deck.slideCount === 1 ? 'slide' : 'slides'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(deck.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDelete(deck.id)}
                    disabled={deleteMutation.isPending}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded transition-colors text-sm ${
                      deleteConfirmId === deck.id
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{deleteConfirmId === deck.id ? 'Confirm?' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
