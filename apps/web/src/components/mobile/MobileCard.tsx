import { Edit2, Trash2 } from 'lucide-react';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { formatDistanceToNow } from 'date-fns';

export interface MobileCardProps {
  id: string;
  textContent: string;
  createdAt: string | Date;
  memoryType?: string;
  onTap?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MobileCard({
  id,
  textContent,
  createdAt,
  memoryType,
  onTap,
  onEdit,
  onDelete,
}: MobileCardProps) {
  const { handleTouchStart, handleTouchMove, handleTouchEnd, translateX, isSwiping } = useSwipeGesture({
    threshold: 50,
  });

  const showActions = translateX < -30;

  const handleCardClick = () => {
    if (!isSwiping && onTap) {
      onTap();
    }
  };

  const timestamp = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: false });

  return (
    <div className="relative overflow-hidden">
      {/* Swipe action buttons (hidden behind card) */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-3">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="bg-blue-600 text-white p-3 rounded-lg min-w-tap min-h-tap flex items-center justify-center"
          >
            <Edit2 className="h-5 w-5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="bg-red-600 text-white p-3 rounded-lg min-w-tap min-h-tap flex items-center justify-center"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Main card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
        className="bg-white border border-gray-200 rounded-lg p-3 active:bg-gray-50 transition-colors"
        style={{
          transform: `translateX(${Math.min(0, translateX)}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-gray-900 line-clamp-2 flex-1">
            {textContent}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-2">
          {memoryType && (
            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
              {memoryType}
            </span>
          )}
          <span className="text-xs text-gray-500">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}
