import { useState } from 'react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useNavigate } from 'react-router-dom';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { getAllQuestions, deleteQuestion } from '../api/questions';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import {
  Eye,
  Search,
  RefreshCw,
  MessageSquare,
  Trash2,
  Calendar,
  Brain
} from 'lucide-react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useIsMobile } from '../hooks/useIsMobile';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useHaptics } from '../hooks/useHaptics';

import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
export function QuestionsPage() {
    const helpPopup = useHelpPopup('questions');
const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { haptic } = useHaptics();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all questions
  const { data: questions, isLoading, refetch } = useQuery({
    queryKey: ['questions'],
    queryFn: getAllQuestions,
  });

  // Pull-to-refresh
  const { isPulling, isRefreshing, pullDistance, handleTouchStart, handleTouchMove, handleTouchEnd } =
    usePullToRefresh({
      onRefresh: async () => {
        await refetch();
      },
    });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => {
      haptic('success');
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
    onError: () => {
      haptic('error');
      alert('Failed to delete question');
    },
  });

  // Filter questions based on search term
  const filteredQuestions = questions?.filter((q) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      q.question.toLowerCase().includes(searchLower) ||
      q.answer?.toLowerCase().includes(searchLower) ||
      q.memory?.title?.toLowerCase().includes(searchLower)
    );
  });

  const handleDelete = (e: React.MouseEvent, questionId: string) => {
    e.stopPropagation();
    if (confirm('Delete this question?')) {
      deleteMutation.mutate(questionId);
    }
  };

  return (
    <div
      className="max-w-4xl mx-auto relative"
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
      data-scroll-container
    >
      {/* Pull-to-refresh indicator */}
      {isMobile && (isPulling || isRefreshing) && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 transition-all"
          style={{
            transform: `translate(-50%, ${Math.min(pullDistance - 40, 20)}px)`,
            opacity: Math.min(pullDistance / 80, 1)
          }}
        >
          <RefreshCw
            className={`h-6 w-6 text-purple-600 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-1 md:mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Questions</h1>
      </div>
      <p className="hidden md:block text-gray-600 mb-6">Questions you've asked and their AI-generated answers</p>

      {/* Search bar */}
      <div className="mb-4 md:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions..."
            className="w-full h-12 md:h-10 pl-10 pr-4 py-2 text-base md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* Questions list */}
      {!isLoading && filteredQuestions && filteredQuestions.length > 0 && (
        <div className="space-y-3 md:space-y-4">
          {filteredQuestions.map((question) => (
            <div
              key={question.id}
              className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
              onClick={() => navigate(`/app/questions/${question.id}`)}
            >
              {/* Question header with icon */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base font-medium text-gray-900 break-words">
                    {question.question}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/app/questions/${question.id}`);
                    }}
                    className="hidden md:flex flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-full"
                    title="View details"
                  >
                    <Eye className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, question.id)}
                    className="hidden md:flex flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-full"
                    title="Delete question"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>

              {/* Answer */}
              {question.answer ? (
                <div className="ml-11 mb-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {question.answer}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="ml-11 mb-3">
                  <p className="text-sm text-gray-500 italic">No answer available</p>
                </div>
              )}

              {/* Footer with metadata */}
              <div className="flex items-center gap-2 md:gap-4 ml-11 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                </div>
                {question.memory && (
                  <div className="flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    <span className="truncate max-w-[200px]">
                      {question.memory.title || question.memory.body?.substring(0, 30) || 'Memory'}
                    </span>
                  </div>
                )}
              </div>

              {/* Mobile delete button */}
              {isMobile && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => handleDelete(e, question.id)}
                    className="w-full flex items-center justify-center gap-2 h-10 px-4 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state (no questions) */}
      {!isLoading && (!questions || questions.length === 0) && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Start asking questions about your memories using the Ask button on the capture page
          </p>
          <button
            onClick={() => navigate('/app/capture')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Ask a Question
          </button>
        </div>
      )}

      {/* No search results */}
      {!isLoading && questions && questions.length > 0 && filteredQuestions && filteredQuestions.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No questions match your search. Try a different term.</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Clear search
          </button>
        </div>
      )}
      {/* Help Popup */}
      <HelpPopup
        pageKey="questions"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}