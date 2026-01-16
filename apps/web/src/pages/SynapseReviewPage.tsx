import { useState } from 'react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Brain, ChevronLeft, CheckCircle, RotateCcw } from 'lucide-react';
import { getDueReviews, submitReview, ReviewRating, ReviewMemory } from '../api/reviews';
import { useHaptics } from '../hooks/useHaptics';

export function SynapseReviewPage() {
    const helpPopup = useHelpPopup('review');
const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { haptic } = useHaptics();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [_reviewedCount, setReviewedCount] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['due-reviews'],
    queryFn: () => getDueReviews(50),
  });

  const submitReviewMutation = useMutation({
    mutationFn: ({ memoryId, rating }: { memoryId: string; rating: ReviewRating }) =>
      submitReview(memoryId, rating),
    onSuccess: () => {
      setReviewedCount(prev => prev + 1);
      setIsFlipped(false);

      // Move to next card or finish
      if (currentIndex < (data?.reviews.length || 0) - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // All reviews complete
        queryClient.invalidateQueries({ queryKey: ['reviews-count'] });
        queryClient.invalidateQueries({ queryKey: ['review-stats'] });
        navigate('/app/feed');
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading reviews...</div>
      </div>
    );
  }

  if (!data || data.reviews.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">All caught up!</h2>
        <p className="text-gray-600 mb-6">No reviews due right now. Great work!</p>
        <button
          onClick={() => navigate('/app/feed')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const currentMemory: ReviewMemory = data.reviews[currentIndex];
  const progress = ((currentIndex + 1) / data.reviews.length) * 100;

  const handleRating = (rating: ReviewRating) => {
    // Haptic feedback based on rating
    if (rating === 'again') {
      haptic('error');
    } else if (rating === 'hard') {
      haptic('warning');
    } else if (rating === 'good') {
      haptic('medium');
    } else if (rating === 'easy') {
      haptic('success');
    }

    submitReviewMutation.mutate({
      memoryId: currentMemory.id,
      rating,
    });
  };

  const getIntervalText = (rating: ReviewRating): string => {
    const reviewCount = currentMemory.reviewCount || 0;

    switch (rating) {
      case 'again':
        return '1d';
      case 'hard':
        return reviewCount === 0 ? '1d' : '3d';
      case 'good':
        return reviewCount === 0 ? '1d' : reviewCount === 1 ? '6d' : '14d';
      case 'easy':
        return reviewCount === 0 ? '1d' : reviewCount === 1 ? '6d' : '30d';
      default:
        return '?';
    }
  };

  const getMemoryContent = () => {
    if (currentMemory.wordLinks && currentMemory.wordLinks.length > 0) {
      return {
        front: `What does "${currentMemory.wordLinks[0].word.word}" mean?`,
        back: currentMemory.wordLinks[0].word.description || currentMemory.body || 'No definition available',
      };
    }

    if (currentMemory.title && currentMemory.body) {
      return {
        front: currentMemory.title,
        back: currentMemory.body,
      };
    }

    return {
      front: 'What was this memory about?',
      back: currentMemory.body || currentMemory.title || 'No content available',
    };
  };

  const { front, back } = getMemoryContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/app/feed')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Exit</span>
          </button>

          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-gray-900">
              {currentIndex + 1} / {data.reviews.length}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Review Card */}
          <div
            onClick={() => {
              haptic('light');
              setIsFlipped(!isFlipped);
            }}
            className="relative bg-white rounded-2xl shadow-xl cursor-pointer transition-all hover:shadow-2xl"
            style={{ minHeight: '400px' }}
          >
            {!isFlipped ? (
              // Front of card
              <div className="p-8 flex flex-col items-center justify-center h-full" style={{ minHeight: '400px' }}>
                <div className="text-sm text-gray-500 mb-4">QUESTION</div>
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
                  {front}
                </h2>
                <div className="flex items-center gap-2 text-gray-400 animate-bounce">
                  <RotateCcw className="h-5 w-5" />
                  <span className="text-sm">Tap to reveal answer</span>
                </div>

                {/* Memory metadata */}
                <div className="mt-auto pt-6 text-center">
                  <p className="text-sm text-gray-500">
                    {currentMemory.reviewCount === 0 ? (
                      'Never reviewed'
                    ) : (
                      <>
                        Reviewed {currentMemory.reviewCount} {currentMemory.reviewCount === 1 ? 'time' : 'times'}
                        {currentMemory.lapseCount > 0 && ` • ${currentMemory.lapseCount} lapses`}
                      </>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              // Back of card
              <div className="p-8 flex flex-col" style={{ minHeight: '400px' }}>
                <div className="text-sm text-gray-500 mb-4 text-center">ANSWER</div>
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xl text-gray-900 text-center leading-relaxed">
                    {back}
                  </p>
                </div>

                {/* Context info */}
                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600">
                    Created {new Date(currentMemory.createdAt).toLocaleDateString()}
                  </p>
                  {currentMemory.location && (
                    <p className="text-sm text-gray-500 mt-1">
                      📍 {currentMemory.location.name}
                    </p>
                  )}
                  {currentMemory.person && (
                    <p className="text-sm text-gray-500 mt-1">
                      👤 {currentMemory.person.displayName}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Rating Buttons (only show when flipped) */}
          {isFlipped && (
            <div className="mt-6 grid grid-cols-4 gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRating('again');
                }}
                className="flex flex-col items-center gap-2 p-4 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                disabled={submitReviewMutation.isPending}
              >
                <span className="font-semibold">Again</span>
                <span className="text-xs opacity-90">{getIntervalText('again')}</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRating('hard');
                }}
                className="flex flex-col items-center gap-2 p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                disabled={submitReviewMutation.isPending}
              >
                <span className="font-semibold">Hard</span>
                <span className="text-xs opacity-90">{getIntervalText('hard')}</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRating('good');
                }}
                className="flex flex-col items-center gap-2 p-4 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                disabled={submitReviewMutation.isPending}
              >
                <span className="font-semibold">Good</span>
                <span className="text-xs opacity-90">{getIntervalText('good')}</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRating('easy');
                }}
                className="flex flex-col items-center gap-2 p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                disabled={submitReviewMutation.isPending}
              >
                <span className="font-semibold">Easy</span>
                <span className="text-xs opacity-90">{getIntervalText('easy')}</span>
              </button>
            </div>
          )}

          {/* Helpful tip */}
          {!isFlipped && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Try to recall the answer before flipping the card
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Help Popup */}
      <HelpPopup
        pageKey="review"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}