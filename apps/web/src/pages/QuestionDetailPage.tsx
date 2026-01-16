import { useState } from 'react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useParams, useNavigate } from 'react-router-dom';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { getQuestion, deleteQuestion } from '../api/questions';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { ArrowLeft, Trash2, Calendar, Brain, MessageSquare } from 'lucide-react';

import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
export function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');

  // Fetch question
  const { data: question, isLoading, isError } = useQuery({
    queryKey: ['question', id],
    queryFn: () => getQuestion(id!),
    enabled: !!id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteQuestion(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      navigate('/app/questions');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to delete question');
      setShowDeleteConfirm(false);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading question...</div>
        </div>
      </div>
    );
  }

  if (isError || !question) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Question not found or you don't have permission to view it.
        </div>
        <button
          onClick={() => navigate('/app/questions')}
          className="mt-4 flex items-center gap-2 text-purple-600 hover:text-purple-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Questions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/app/questions')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Questions
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-5 w-5 text-purple-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Question Details</h1>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Question Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="space-y-6">
          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Question</label>
            <div className="text-lg text-gray-900 whitespace-pre-wrap">{question.question}</div>
          </div>

          {/* Answer */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Answer</label>
            {question.answer ? (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-gray-900 whitespace-pre-wrap">{question.answer}</div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-500 italic">No answer available</p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Asked: {new Date(question.createdAt).toLocaleString()}</span>
              </div>
              {question.updatedAt !== question.createdAt && (
                <div className="flex items-center gap-1">
                  <span>Updated: {new Date(question.updatedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Linked Memory Section */}
      {question.memory && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Related Memory</h2>
          </div>

          <div
            onClick={() => navigate(`/app/memories/${question.memory?.id}`)}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors"
          >
            <p className="text-gray-900 font-medium line-clamp-3 mb-2">
              {question.memory.title || question.memory.body || 'Untitled memory'}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-3 w-3" />
              {question.memory.occurredAt ? (
                <span>{new Date(question.memory.occurredAt).toLocaleDateString()}</span>
              ) : (
                <span>No date</span>
              )}
            </div>
            <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
              View Memory →
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !deleteMutation.isPending) {
              deleteMutation.mutate();
            } else if (e.key === 'Escape') {
              setShowDeleteConfirm(false);
            }
          }}
          tabIndex={-1}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Question?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                autoFocus
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Help Popup */}
      <HelpPopup
        pageKey="question-detail"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}