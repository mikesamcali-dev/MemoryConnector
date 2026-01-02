import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: ReactNode;
}

/**
 * Sticky mobile page header with back button and action buttons
 */
export function MobileHeader({ title, showBack = false, onBack, actions }: MobileHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 pt-safe-t">
      <div className="flex items-center justify-between px-3 h-14">
        {/* Back button or spacer */}
        <div className="min-w-tap">
          {showBack && (
            <button
              onClick={handleBack}
              className="min-w-tap min-h-tap flex items-center justify-center text-gray-600 active:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Title */}
        <h1 className="text-lg font-semibold text-gray-900 truncate px-2">
          {title}
        </h1>

        {/* Actions or spacer */}
        <div className="min-w-tap flex items-center justify-end gap-1">
          {actions}
        </div>
      </div>
    </header>
  );
}
