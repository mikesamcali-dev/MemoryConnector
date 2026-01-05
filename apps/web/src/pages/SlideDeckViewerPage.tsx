import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { getSlides } from '../api/slidedecks';
import { SlideCard } from '../components/SlideCard';
import { useIsMobile } from '../hooks/useIsMobile';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

export function SlideDeckViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch slides
  const {
    data: slides,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['slides', id],
    queryFn: () => getSlides(id!),
    enabled: !!id,
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handlePrevious();
      } else if (e.key === 'Escape') {
        handleExit();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, slides]);

  const handlePrevious = () => {
    if (slides && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (slides && currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleExit = () => {
    navigate('/app/slidedecks');
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading slides...</p>
        </div>
      </div>
    );
  }

  if (error || !slides || slides.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">
            {error ? 'Failed to load slides' : 'No slides found'}
          </p>
          <button
            onClick={handleExit}
            className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100"
          >
            Back to Slide Decks
          </button>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top bar - Desktop with View Memory and Exit buttons, Mobile with counter only */}
      <div className="p-3 md:p-4 flex justify-between items-center bg-gray-800 border-b border-gray-700">
        <div className="text-white font-medium text-sm md:text-base">
          Slide {currentIndex + 1} of {slides.length}
        </div>
        {!isMobile && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/app/memories/${currentSlide.memory.id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Memory</span>
            </button>
            <button
              onClick={handleExit}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
              <span>Exit</span>
            </button>
          </div>
        )}
      </div>

      {/* Slide content - Scrollable on mobile, centered on desktop */}
      <div
        className="flex-1 overflow-y-auto p-4 md:p-8 md:flex md:items-center md:justify-center"
        {...(isMobile ? swipeHandlers : {})}
      >
        <div className="w-full md:max-w-4xl">
          <SlideCard slide={slides[currentIndex]} />
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
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors flex-shrink-0 ${
                  index === currentIndex ? 'bg-white' : 'bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === slides.length - 1}
            className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-3 md:py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors min-w-[80px] md:min-w-[100px]"
          >
            <span className="text-sm md:text-base">Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile: View Memory and Exit buttons */}
        {isMobile && (
          <div className="px-3 pb-3 pt-0 flex gap-2">
            <button
              onClick={() => navigate(`/app/memories/${currentSlide.memory.id}`)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Memory</span>
            </button>
            <button
              onClick={handleExit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <X className="w-5 h-5" />
              <span>Close</span>
            </button>
          </div>
        )}

        {/* Keyboard shortcuts hint - Desktop only */}
        {!isMobile && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-400 text-center">
              Use arrow keys to navigate • Press ESC to exit
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
