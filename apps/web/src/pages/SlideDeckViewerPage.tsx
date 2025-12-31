import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSlides } from '../api/slidedecks';
import { SlideCard } from '../components/SlideCard';

export function SlideDeckViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top bar */}
      <div className="p-4 flex justify-between items-center bg-gray-800 border-b border-gray-700">
        <div className="text-white font-medium">
          Slide {currentIndex + 1} of {slides.length}
        </div>
        <button
          onClick={handleExit}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
          <span>Exit</span>
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <SlideCard slide={slides[currentIndex]} />
      </div>

      {/* Navigation bar */}
      <div className="p-4 flex justify-between items-center bg-gray-800 border-t border-gray-700">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous</span>
        </button>

        {/* Progress indicator */}
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-gray-600 hover:bg-gray-500'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === slides.length - 1}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <span>Next</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
        <p className="text-xs text-gray-400 text-center">
          Use arrow keys to navigate • Press ESC to exit
        </p>
      </div>
    </div>
  );
}
