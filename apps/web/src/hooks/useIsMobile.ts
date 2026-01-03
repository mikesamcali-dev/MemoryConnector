import { useState, useEffect } from 'react';

/**
 * Hook to detect if the viewport is mobile size (< 768px)
 * Uses Tailwind's md breakpoint as the threshold
 * Handles SSR safely and listens to resize events
 */
export function useIsMobile(): boolean {
  // Default to mobile-first to prevent flash of desktop layout
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check immediately on mount
    checkIsMobile();

    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}
