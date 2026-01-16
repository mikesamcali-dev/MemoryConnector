import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHelpViewState, incrementHelpViewCount } from '../api/helpViews';

export function useHelpPopup(pageKey: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownThisSession, setHasShownThisSession] = useState(false);
  const queryClient = useQueryClient();

  // Fetch help view state on mount
  const { data: helpState } = useQuery({
    queryKey: ['help-view-state', pageKey],
    queryFn: () => getHelpViewState(pageKey),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Increment mutation
  const incrementMutation = useMutation({
    mutationFn: () => incrementHelpViewCount(pageKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-view-state', pageKey] });
    },
  });

  // Auto-show popup on mount if conditions met
  useEffect(() => {
    if (helpState?.shouldShow && !hasShownThisSession && !isOpen) {
      // Small delay to ensure page has rendered
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShownThisSession(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [helpState, hasShownThisSession, isOpen]);

  const closePopup = () => {
    setIsOpen(false);
    // Increment view count when closing
    if (helpState?.shouldShow) {
      incrementMutation.mutate();
    }
  };

  const manualShow = () => {
    setIsOpen(true);
  };

  return {
    isOpen,
    closePopup,
    manualShow,
    viewCount: helpState?.viewCount ?? 0,
    shouldShow: helpState?.shouldShow ?? false,
  };
}
