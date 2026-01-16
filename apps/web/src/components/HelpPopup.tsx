import { useEffect } from 'react';
import { X, HelpCircle } from 'lucide-react';
import { HELP_CONTENT, HelpContent } from '../constants/helpContent';

interface HelpPopupProps {
  pageKey: string;
  isOpen: boolean;
  onClose: () => void;
}

export function HelpPopup({ pageKey, isOpen, onClose }: HelpPopupProps) {
  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content: HelpContent | undefined = HELP_CONTENT[pageKey];

  if (!content) {
    console.warn(`No help content found for page: ${pageKey}`);
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-popup-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <h2
              id="help-popup-title"
              className="text-lg md:text-xl font-semibold text-gray-900"
            >
              {content.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close help"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Description */}
          <p className="text-sm text-gray-600">{content.description}</p>

          {/* Key Features */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Key Features:
            </h3>
            <ul className="space-y-1.5">
              {content.keyFeatures.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            This helper shows 3 times per page
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
