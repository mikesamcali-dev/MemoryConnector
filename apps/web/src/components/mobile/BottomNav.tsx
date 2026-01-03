import { Link, useLocation } from 'react-router-dom';
import { Plus, Search, Bell, Settings, MoreHorizontal } from 'lucide-react';

interface BottomNavProps {
  onMoreClick?: () => void;
}

export function BottomNav({ onMoreClick }: BottomNavProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/app/capture', icon: Plus, label: 'Capture' },
    { path: '/app/search', icon: Search, label: 'Search' },
    { path: '/app/reminders', icon: Bell, label: 'Reminders' },
    { path: '/app/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg safe-bottom"
      aria-label="Mobile bottom navigation"
    >
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={`
                flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] px-2 py-1.5 rounded-lg transition-all
                ${active
                  ? 'text-blue-600'
                  : 'text-gray-600 active:bg-gray-100'
                }
              `}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={onMoreClick}
          aria-label="More options"
          className="flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] px-2 py-1.5 rounded-lg text-gray-600 active:bg-gray-100 transition-all"
        >
          <MoreHorizontal className="h-6 w-6" />
          <span className="text-[10px] font-medium leading-tight">More</span>
        </button>
      </div>
    </nav>
  );
}
