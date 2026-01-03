import { useState } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { Eye, Trash2, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHaptics } from '../hooks/useHaptics';

interface SwipeableMemoryCardProps {
  memory: {
    id: string;
    textContent: string;
    createdAt: string;
    type?: string;
  };
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
}

const SWIPE_THRESHOLD = 100; // pixels to trigger action
const SWIPE_VELOCITY_THRESHOLD = 500; // velocity to trigger action

export function SwipeableMemoryCard({ memory, onDelete, onArchive }: SwipeableMemoryCardProps) {
  const navigate = useNavigate();
  const { haptic } = useHaptics();
  const controls = useAnimation();
  const [dragX, setDragX] = useState(0);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipe = offset.x;
    const swipeVelocity = velocity.x;

    // Determine if swipe threshold was met
    const shouldDelete = swipe < -SWIPE_THRESHOLD || swipeVelocity < -SWIPE_VELOCITY_THRESHOLD;
    const shouldArchive = swipe > SWIPE_THRESHOLD || swipeVelocity > SWIPE_VELOCITY_THRESHOLD;

    if (shouldDelete && onDelete) {
      // Swipe left - delete
      haptic('error');
      controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } }).then(() => {
        onDelete(memory.id);
      });
    } else if (shouldArchive && onArchive) {
      // Swipe right - archive
      haptic('success');
      controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } }).then(() => {
        onArchive(memory.id);
      });
    } else {
      // Reset position
      haptic('light');
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
    }

    setDragX(0);
  };

  const handleClick = () => {
    navigate(`/app/memories/${memory.id}`);
  };

  // Calculate background color based on drag position
  const getBackgroundColor = () => {
    if (dragX < -50) return 'bg-red-100'; // Deleting
    if (dragX > 50) return 'bg-green-100'; // Archiving
    return 'bg-white';
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background action indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
        {/* Archive indicator (right) */}
        <div
          className="flex items-center gap-2 text-green-600 transition-opacity"
          style={{ opacity: Math.min(dragX / 100, 1) }}
        >
          <Archive className="h-6 w-6" />
          <span className="font-medium">Archive</span>
        </div>

        {/* Delete indicator (left) */}
        <div
          className="flex items-center gap-2 text-red-600 transition-opacity"
          style={{ opacity: Math.min(-dragX / 100, 1) }}
        >
          <span className="font-medium">Delete</span>
          <Trash2 className="h-6 w-6" />
        </div>
      </div>

      {/* Swipeable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDrag={(event, info) => {
          setDragX(info.offset.x);
        }}
        onDragEnd={handleDragEnd}
        animate={controls}
        className={`${getBackgroundColor()} border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group active:bg-gray-50 relative z-10`}
        onClick={handleClick}
      >
        <div className="flex items-start justify-between gap-2 md:gap-4">
          <p className="text-sm md:text-base text-gray-900 flex-1 line-clamp-2">
            {memory.textContent}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/app/memories/${memory.id}`);
            }}
            className="hidden md:flex flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-full"
            title="View details"
          >
            <Eye className="h-4 w-4 text-gray-600" />
          </button>
        </div>
        <div className="flex items-center gap-2 md:gap-4 mt-2 md:mt-3 text-xs text-gray-500">
          <span>{new Date(memory.createdAt).toLocaleDateString()}</span>
          {memory.type && (
            <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">
              {memory.type}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
