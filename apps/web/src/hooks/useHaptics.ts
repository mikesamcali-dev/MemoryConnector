/**
 * Hook for providing haptic feedback on supported devices
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function useHaptics() {
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const haptic = (type: HapticType = 'light') => {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 10],
      warning: [20, 100, 20],
      error: [30, 100, 30, 100, 30],
    };

    vibrate(patterns[type]);
  };

  return { haptic, vibrate };
}
