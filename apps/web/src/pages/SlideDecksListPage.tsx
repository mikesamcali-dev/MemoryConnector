import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Presentation, Trash2, Eye, Plus } from 'lucide-react';
import {
  getAllSlideDecks,
  createSlideDeckFromOverdue,
  deleteSlideDeck,
} from '../api/slidedecks';
import { format } from 'date-fns';

export function SlideDecksListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch slide decks
  const {
    data: slideDecks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['slidedecks'],
    queryFn: getAllSlideDecks,
  });

  // Create slide deck mutation
  const createMutation = useMutation({
    mutationFn: createSlideDeckFromOverdue,
    onSuccess: (newDeck) => {
      queryClient.invalidateQueries({ queryKey: ['slidedecks'] });
      // Navigate to the new deck
      navigate(`/app/slidedecks/${newDeck.id}/view`);
    },
    onError: (error: Error) => {
      alert(error.message);
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
    createMutation.mutate(undefined);
  };

  const handleView = (id: string) => {
    navigate(`/app/slidedecks/${id}/view`);
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Presentation className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Slide Decks</h1>
          </div>
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {createMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Create from Overdue Reminders</span>
              </>
            )}
          </button>
        </div>
        <p className="text-gray-600 mt-2">
          Review your memories in a slideshow format
        </p>
      </div>

      {/* Slide Decks List */}
      {!slideDecks || slideDecks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Presentation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No slide decks yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create a slide deck from your overdue reminders to get started
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {deck.title || (
                      <span className="italic text-gray-400">Untitled</span>
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
      )}
    </div>
  );
}
