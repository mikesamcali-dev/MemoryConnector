import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Brain, Plus, Search, Database, Bell, Settings, LogOut, ShieldCheck, MapPin, User, Network, Video, Film, Image, Link as LinkIcon, Presentation, MoreHorizontal, ChevronDown, BookOpen, FolderKanban, GraduationCap, Twitter, MessageSquare, HelpCircle, Sparkles, BookMarked } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { BottomNav } from './mobile/BottomNav';
import { BottomSheet } from './mobile/BottomSheet';
import { HelpPopup } from './HelpPopup';
import { getDueRemindersCount } from '../api/reminders';
import { getDueReviewCount } from '../api/samReviews';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isDesktopMoreOpen, setIsDesktopMoreOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Fetch due reminders count
  const { data: dueCount } = useQuery({
    queryKey: ['due-reminders-count'],
    queryFn: getDueRemindersCount,
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch due reviews count
  const { data: dueReviewsCount } = useQuery({
    queryKey: ['due-reviews-count'],
    queryFn: getDueReviewCount,
    refetchInterval: 60000, // Refetch every minute
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determine page key for help popup based on current route
  const getPageKey = (): string | null => {
    const path = location.pathname;

    // Map routes to help content keys
    const routeMap: Record<string, string> = {
      '/app/capture': 'capture',
      '/app/search': 'search',
      '/app/reminders': 'reminders',
      '/app/memories': 'memories',
      '/app/sam': 'sam',
      '/app/reviews': 'reviews',
      '/app/projects': 'projects',
      '/app/memory-decks': 'memory-decks',
      '/app/training-decks': 'training-decks',
      '/app/words': 'words',
      '/app/questions': 'questions',
      '/app/locations': 'locations',
      '/app/people': 'people',
      '/app/relationships': 'relationships',
      '/app/images': 'images',
      '/app/urls': 'urls',
      '/app/youtube-videos': 'youtube-videos',
      '/app/tiktok-videos': 'tiktok-videos',
      '/app/twitter-posts': 'twitter-posts',
      '/app/settings': 'settings',
    };

    // Check for viewer pages
    if (path.includes('/memory-decks/') && path.includes('/view')) {
      return 'memory-deck-viewer';
    }
    if (path.includes('/training-decks/') && path.includes('/view')) {
      return 'training-deck-viewer';
    }

    return routeMap[path] || null;
  };

  const currentPageKey = getPageKey();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const renderBadge = (path: string) => {
    if (path === '/app/reminders' && dueCount && dueCount.count > 0) {
      return (
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
          {dueCount.count > 99 ? '99+' : dueCount.count}
        </span>
      );
    }
    if (path === '/app/reviews' && dueReviewsCount && dueReviewsCount.count > 0) {
      return (
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-blue-500 text-white text-xs font-bold rounded-full">
          {dueReviewsCount.count > 99 ? '99+' : dueReviewsCount.count}
        </span>
      );
    }
    return null;
  };

  const baseNavItems = [
    { path: '/app/capture', icon: Plus, label: 'Capture' },
    { path: '/app/memory-decks', icon: Presentation, label: 'Memories' },
    { path: '/app/search', icon: Search, label: 'Search' },
    { path: '/app/memories', icon: Database, label: 'Memories' },
    { path: '/app/sam', icon: Sparkles, label: 'SAM' },
    { path: '/app/reviews', icon: BookMarked, label: 'Reviews' },
    { path: '/app/projects', icon: FolderKanban, label: 'Topics' },
    { path: '/app/trainings', icon: GraduationCap, label: 'Trainings' },
    { path: '/app/training-decks', icon: GraduationCap, label: 'Train' },
    { path: '/app/words', icon: BookOpen, label: 'Words' },
    { path: '/app/questions', icon: MessageSquare, label: 'Questions' },
    { path: '/app/locations', icon: MapPin, label: 'Locations' },
    { path: '/app/people', icon: User, label: 'People' },
    { path: '/app/images', icon: Image, label: 'Images' },
    { path: '/app/urls', icon: LinkIcon, label: 'URLs' },
    { path: '/app/youtube-videos', icon: Video, label: 'YouTube' },
    { path: '/app/tiktok-videos', icon: Film, label: 'TikTok' },
    { path: '/app/twitter-posts', icon: Twitter, label: 'X' },
    { path: '/app/relationships', icon: Network, label: 'Network' },
    { path: '/app/reminders', icon: Bell, label: 'Reminders' },
    { path: '/app/settings', icon: Settings, label: 'Settings' },
  ];

  // Add admin link if user is admin
  const navItems = user?.roles.includes('admin')
    ? [...baseNavItems, { path: '/app/admin', icon: ShieldCheck, label: 'Admin' }]
    : baseNavItems;

  // Items shown in bottom nav (mobile) - defined in BottomNav component
  const bottomNavPaths = ['/app/capture', '/app/memory-decks', '/app/training-decks', '/app/search'];

  // Primary nav items for desktop (in order: Capture, Slides, Train, Search)
  const desktopPrimaryPaths = ['/app/capture', '/app/memory-decks', '/app/training-decks', '/app/search'];

  // Desktop "More" menu items (excluding primary paths and admin)
  const desktopMoreItems = navItems.filter(
    item => !desktopPrimaryPaths.includes(item.path) &&
            item.path !== '/app/admin'
  );

  // Overflow items for "More" menu (mobile)
  const moreNavItems = navItems.filter(
    item => !bottomNavPaths.includes(item.path)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar - Desktop only */}
      {!isMobile && (
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/app/feed" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 hidden sm:inline">Memory Connector</span>
            </Link>

            {/* Main Navigation */}
            <div className="flex items-center gap-1">
              {/* Primary Nav Items - Capture, Slides, Train, Search */}
              {desktopPrimaryPaths.map((path) => {
                const item = navItems.find(i => i.path === path);
                if (!item) return null;
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                      ${active
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* More Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDesktopMoreOpen(!isDesktopMoreOpen)}
                  onBlur={() => setTimeout(() => setIsDesktopMoreOpen(false), 200)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
                >
                  <MoreHorizontal className="h-5 w-5" />
                  <span>More</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isDesktopMoreOpen && (
                  <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {desktopMoreItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      const badge = renderBadge(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsDesktopMoreOpen(false)}
                          className={`
                            flex items-center justify-between px-4 py-2 font-medium transition-all
                            ${active
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-100'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </div>
                          {badge}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Admin (if user is admin) */}
              {user?.roles.includes('admin') && (
                <Link
                  to="/app/admin"
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                    ${isActive('/app/admin')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <ShieldCheck className="h-5 w-5" />
                  <span>Admin</span>
                </Link>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {/* Help Button */}
              {currentPageKey && (
                <button
                  onClick={() => setIsHelpOpen(true)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Show help for this page"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              )}

              {/* Reminder Notification Bell */}
              <Link
                to="/app/reminders"
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title={dueCount && dueCount.count > 0 ? `${dueCount.count} due reminder${dueCount.count > 1 ? 's' : ''}` : 'Reminders'}
              >
                <Bell className="h-5 w-5" />
                {dueCount && dueCount.count > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    {dueCount.count > 99 ? '99+' : dueCount.count}
                  </span>
                )}
              </Link>

              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{user?.email}</span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium uppercase">
                  {user?.tier || 'free'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      )}

      {/* Mobile Header - Mobile only */}
      {isMobile && (
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-14 px-4">
            {/* Help Button */}
            {currentPageKey ? (
              <button
                onClick={() => setIsHelpOpen(true)}
                className="p-2 text-gray-600 hover:text-blue-600 active:bg-blue-50 rounded-lg transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                title="Show help for this page"
              >
                <HelpCircle className="h-6 w-6" />
              </button>
            ) : (
              <div className="w-10"></div>
            )}

            <Link to="/app/feed" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Brain className="h-7 w-7 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">MC</span>
            </Link>

            {/* Reminder Bell */}
            <Link
              to="/app/reminders"
              className="relative p-2 text-gray-600 hover:text-blue-600 active:bg-blue-50 rounded-lg transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
              title={dueCount && dueCount.count > 0 ? `${dueCount.count} due reminder${dueCount.count > 1 ? 's' : ''}` : 'Reminders'}
            >
              <Bell className="h-6 w-6" />
              {dueCount && dueCount.count > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  {dueCount.count > 99 ? '99+' : dueCount.count}
                </span>
              )}
            </Link>
          </div>
        </div>
      )}

      {/* Page Content */}
      <main className={`
        ${isMobile ? 'px-3 pt-4 pb-20' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}
      `}>
        {children}
      </main>

      {/* Footer - Desktop only */}
      {!isMobile && (
      <footer className="mt-auto border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <p>© 2025 Memory Connector</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Help</a>
            </div>
          </div>
        </div>
      </footer>
      )}

      {/* Bottom Navigation - Mobile only */}
      {isMobile && <BottomNav onMoreClick={() => setIsMoreMenuOpen(true)} />}

      {/* More Menu Bottom Sheet - Mobile only */}
      <BottomSheet
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        title="More"
      >
        <div className="space-y-1">
          {moreNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMoreMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all min-h-tap
                  ${active
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 active:bg-gray-100'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Logout option in More menu */}
          <button
            onClick={() => {
              setIsMoreMenuOpen(false);
              handleLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-600 active:bg-red-50 transition-all min-h-tap"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </BottomSheet>

      {/* Help Popup */}
      {currentPageKey && (
        <HelpPopup
          pageKey={currentPageKey}
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
        />
      )}
    </div>
  );
}
