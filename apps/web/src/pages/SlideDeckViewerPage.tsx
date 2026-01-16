import { useState, useEffect, useRef } from 'react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useParams, useNavigate } from 'react-router-dom';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useQuery } from '@tanstack/react-query';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { X, ChevronLeft, ChevronRight, ExternalLink, Play, Pause } from 'lucide-react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { getSlides } from '../api/slidedecks';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { SlideCard } from '../components/SlideCard';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useIsMobile } from '../hooks/useIsMobile';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
type Phase = 'showing' | 'recall' | 'revealed';

export function SlideDeckViewerPage() {
    const helpPopup = useHelpPopup('slidedeck-viewer');
const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('showing');
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(2);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

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

  // Timer management
  useEffect(() => {
    if (isPaused || !slides) return;

    // Clear existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (phase === 'showing') {
      // Show slide for 2 seconds
      setTimeRemaining(2);
      let countdown = 2;

      countdownRef.current = setInterval(() => {
        countdown -= 1;
        setTimeRemaining(countdown);
        if (countdown <= 0 && countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      }, 1000);

      timerRef.current = setTimeout(() => {
        setPhase('recall');
      }, 2000);
    } else if (phase === 'recall') {
      // Blank screen for 5 seconds
      setTimeRemaining(5);
      let countdown = 5;

      countdownRef.current = setInterval(() => {
        countdown -= 1;
        setTimeRemaining(countdown);
        if (countdown <= 0 && countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      }, 1000);

      timerRef.current = setTimeout(() => {
        setPhase('revealed');
      }, 5000);
    }
    // 'revealed' phase waits for user to manually proceed

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [phase, isPaused, slides]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(prev => !prev);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
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
      setPhase('showing');
      setIsPaused(false);
    }
  };

  const handleNext = () => {
    if (phase === 'revealed') {
      // Only allow moving to next slide when in revealed phase
      if (slides && currentIndex < slides.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setPhase('showing');
        setIsPaused(false);
      }
    }
  };

  const handleSkipToReveal = () => {
    setPhase('revealed');
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const handleExit = () => {
    navigate('/app/slidedecks');
  };

  // Swipe gesture handlers for mobile
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: phase === 'revealed' ? handleNext : undefined,
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
        <div className="flex items-center gap-3">
          <div className="text-white font-medium text-sm md:text-base">
            Slide {currentIndex + 1} of {slides.length}
          </div>
          <div className="text-sm text-gray-400">
            {phase === 'showing' && `Showing (${timeRemaining}s)`}
            {phase === 'recall' && `Recall (${timeRemaining}s)`}
            {phase === 'revealed' && 'Revealed'}
          </div>
        </div>
        {!isMobile && (
          <div className="flex items-center gap-2">
            <button
              onClick={togglePause}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
            {phase !== 'revealed' && (
              <button
                onClick={handleSkipToReveal}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Skip to Answer
              </button>
            )}
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
        {...swipeHandlers}
      >
        <div className="w-full md:max-w-4xl">
          {phase === 'showing' && (
            <SlideCard slide={slides[currentIndex]} />
          )}

          {phase === 'recall' && (
            <div className="bg-gray-800 rounded-lg p-8 md:p-16 text-center min-h-[400px] flex flex-col items-center justify-center">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                What did the message read?
              </h2>
              <p className="text-gray-400 text-lg">
                Try to recall the memory...
              </p>
              <div className="mt-8 text-5xl font-bold text-blue-400">
                {timeRemaining}
              </div>
            </div>
          )}

          {phase === 'revealed' && (
            <div className="space-y-4">
              <div className="bg-green-900 border border-green-700 rounded-lg p-4 text-center">
                <p className="text-green-100 font-semibold text-lg">
                  Here's what it said:
                </p>
              </div>
              <SlideCard slide={slides[currentIndex]} />
            </div>
          )}
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
            disabled={phase !== 'revealed' || currentIndex === slides.length - 1}
            className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-3 md:py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors min-w-[80px] md:min-w-[100px]"
          >
            <span className="text-sm md:text-base">Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile: Control buttons */}
        {isMobile && (
          <div className="px-3 pb-3 pt-0 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={togglePause}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              {phase !== 'revealed' && (
                <button
                  onClick={handleSkipToReveal}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Skip to Answer
                </button>
              )}
            </div>
            <div className="flex gap-2">
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
          </div>
        )}

        {/* Keyboard shortcuts hint - Desktop only */}
        {!isMobile && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-400 text-center">
              Use arrow keys to navigate • Press SPACE to pause/resume • Press ESC to exit
            </p>
          </div>
        )}
      </div>
      {/* Help Popup */}
      <HelpPopup
        pageKey="slidedeck-viewer"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}