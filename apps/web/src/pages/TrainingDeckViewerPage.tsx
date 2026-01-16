import { useState, useEffect } from 'react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ChevronLeft, ChevronRight, Trash2, Bell } from 'lucide-react';
import { getLessons, getTrainingDeck, deleteTrainingLesson } from '../api/training-decks';
import { updateLastViewedAt, createReminders } from '../api/trainings';
import { TrainingLessonCard } from '../components/TrainingLessonCard';
import { useIsMobile } from '../hooks/useIsMobile';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

export function TrainingDeckViewerPage() {
    const helpPopup = useHelpPopup('training-deck-viewer');
const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch training deck to get trainingId
  const { data: deck } = useQuery({
    queryKey: ['training-deck', id],
    queryFn: () => getTrainingDeck(id!),
    enabled: !!id,
  });

  // Fetch lessons
  const {
    data: lessons,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['training-lessons', id],
    queryFn: () => getLessons(id!),
    enabled: !!id,
  });

  // Update lastViewedAt when component mounts
  useEffect(() => {
    if (deck?.trainingId) {
      updateLastViewedAt(deck.trainingId).catch((err) => {
        console.error('Failed to update lastViewedAt:', err);
      });
    }
  }, [deck?.trainingId]);

  // Delete lesson mutation
  const deleteLessonMutation = useMutation({
    mutationFn: (lessonId: string) => deleteTrainingLesson(id!, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-lessons', id] });
      setShowDeleteConfirm(false);
      // Navigate to previous lesson or exit if this was the last one
      if (lessons && lessons.length <= 1) {
        handleExit();
      } else if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    },
    onError: () => {
      alert('Failed to delete lesson');
    },
  });

  // Create reminders mutation
  const createRemindersMutation = useMutation({
    mutationFn: () => createReminders(deck!.trainingId),
    onSuccess: (data) => {
      alert(data.message || 'Reminders created successfully!');
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to create reminders');
    },
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handlePrevious();
      } else if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          handleExit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, lessons, showDeleteConfirm]);

  // Reset delete confirmation when lesson changes
  useEffect(() => {
    setShowDeleteConfirm(false);
  }, [currentIndex]);

  const handlePrevious = () => {
    if (lessons && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (lessons && currentIndex < lessons.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleExit = () => {
    navigate('/app/training-decks');
  };

  const handleDeleteLesson = () => {
    if (lessons && lessons[currentIndex]) {
      deleteLessonMutation.mutate(lessons[currentIndex].id);
    }
  };

  const handleCreateReminders = () => {
    if (deck?.trainingId) {
      createRemindersMutation.mutate();
    }
  };

  // Swipe gesture handlers for mobile
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrevious,
    threshold: 50,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading lessons...</p>
        </div>
      </div>
    );
  }

  if (error || !lessons || lessons.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">
            {error ? 'Failed to load lessons' : 'No lessons found'}
          </p>
          <button
            onClick={handleExit}
            className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100"
          >
            Back to Training Decks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top bar */}
      <div className="p-3 md:p-4 flex justify-between items-center bg-gray-800 border-b border-gray-700">
        <div className="text-white font-medium text-sm md:text-base">
          Lesson {currentIndex + 1} of {lessons.length}
        </div>
        <div className="flex items-center gap-2">
          {/* Create Reminders Button */}
          <button
            onClick={handleCreateReminders}
            disabled={!deck?.trainingId || createRemindersMutation.isPending}
            className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-xs md:text-sm"
            title="Create 3 spaced repetition reminders"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden md:inline">Reminders</span>
          </button>

          {/* Delete Lesson Button */}
          {showDeleteConfirm ? (
            <button
              onClick={handleDeleteLesson}
              disabled={deleteLessonMutation.isPending}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs md:text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Confirm?</span>
            </button>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs md:text-sm"
              title="Remove this lesson from the deck"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden md:inline">Edit</span>
            </button>
          )}

          {/* Exit Button - Desktop only */}
          {!isMobile && (
            <button
              onClick={handleExit}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
              <span>Exit</span>
            </button>
          )}
        </div>
      </div>

      {/* Lesson content - Scrollable on mobile, centered on desktop */}
      <div
        className="flex-1 overflow-y-auto p-4 md:p-8 md:flex md:items-center md:justify-center"
        {...swipeHandlers}
      >
        <div className="w-full md:max-w-4xl">
          <TrainingLessonCard lesson={lessons[currentIndex]} />
        </div>
      </div>

      {/* Bottom Navigation - Fixed at bottom */}
      <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700">
        {/* Navigation controls */}
        <div className="p-3 md:p-4 flex justify-between items-center gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-3 md:py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors min-w-[80px] md:min-w-[100px]"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm md:text-base">Previous</span>
          </button>

          {/* Progress indicator */}
          <div className="flex gap-2 flex-1 justify-center overflow-x-auto px-2">
            {lessons.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-purple-500 scale-125'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`Go to lesson ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === lessons.length - 1}
            className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-3 md:py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors min-w-[80px] md:min-w-[100px]"
          >
            <span className="text-sm md:text-base">Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile View Memory button - Only show on mobile */}
        {isMobile && lessons[currentIndex].memory && (
          <div className="p-3 border-t border-gray-700">
            <button
              onClick={handleExit}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <X className="w-5 h-5" />
              <span>Exit Training</span>
            </button>
          </div>
        )}
      </div>
      {/* Help Popup */}
      <HelpPopup
        pageKey="training-deck-viewer"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}