import { ReactNode } from 'react';

export interface TouchTargetProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Wrapper component that ensures minimum 44px touch target size
 * for accessibility and mobile usability
 */
export function TouchTarget({ children, className = '', onClick }: TouchTargetProps) {
  return (
    <div
      onClick={onClick}
      className={`min-w-tap min-h-tap flex items-center justify-center ${className}`}
    >
      {children}
    </div>
  );
}
