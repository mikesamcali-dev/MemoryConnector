import { useState, useCallback, useRef } from 'react';

export interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}

export interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
}

/**
 * Hook to implement pull-to-refresh pattern on mobile
 * Triggers refresh callback when pulled beyond threshold
 */
export function usePullToRefresh(options: PullToRefreshOptions): PullToRefreshState {
  const { onRefresh, threshold = 80, resistance = 2.5 } = options;

  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const touchStartY = useRef<number | null>(null);
  const scrollContainerRef = useRef<Element | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.currentTarget;
    const scrollContainer = target.closest('[data-scroll-container]') || target;
    scrollContainerRef.current = scrollContainer;

    if (scrollContainer.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null || isRefreshing) return;

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || scrollContainer.scrollTop > 0) {
      touchStartY.current = null;
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    const touchCurrentY = e.touches[0].clientY;
    const distance = touchCurrentY - touchStartY.current;

    if (distance > 0) {
      setIsPulling(true);
      const adjustedDistance = distance / resistance;
      setPullDistance(adjustedDistance);

      if (adjustedDistance > threshold) {
        e.preventDefault();
      }
    }
  }, [isRefreshing, threshold, resistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || isRefreshing) {
      touchStartY.current = null;
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold);

      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull-to-refresh error:', error);
      } finally {
        setIsRefreshing(false);
        setIsPulling(false);
        setPullDistance(0);
        touchStartY.current = null;
      }
    } else {
      setIsPulling(false);
      setPullDistance(0);
      touchStartY.current = null;
    }
  }, [isPulling, isRefreshing, pullDistance, threshold, onRefresh]);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
