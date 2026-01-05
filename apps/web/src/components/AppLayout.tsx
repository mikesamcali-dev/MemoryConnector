import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, Plus, Search, Bell, Settings, LogOut, ShieldCheck, MapPin, User, Network, Video, Film, Image, Link as LinkIcon, Presentation, Map, MoreHorizontal, ChevronDown, BookOpen, FolderKanban } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { BottomNav } from './mobile/BottomNav';
import { BottomSheet } from './mobile/BottomSheet';

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const baseNavItems = [
    { path: '/app/capture', icon: Plus, label: 'Capture' },
    { path: '/app/slidedecks', icon: Presentation, label: 'Slides' },
    { path: '/app/search', icon: Search, label: 'Search' },
    { path: '/app/tiktok-videos', icon: Film, label: 'TikTok' },
    { path: '/app/words', icon: BookOpen, label: 'Words' },
    { path: '/app/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/app/atlas', icon: Map, label: 'Atlas' },
    { path: '/app/locations', icon: MapPin, label: 'Locations' },
    { path: '/app/people', icon: User, label: 'People' },
    { path: '/app/images', icon: Image, label: 'Images' },
    { path: '/app/urls', icon: LinkIcon, label: 'URLs' },
    { path: '/app/youtube-videos', icon: Video, label: 'YouTube' },
    { path: '/app/relationships', icon: Network, label: 'Network' },
    { path: '/app/reminders', icon: Bell, label: 'Reminders' },
    { path: '/app/settings', icon: Settings, label: 'Settings' },
  ];

  // Add admin link if user is admin
  const navItems = user?.roles.includes('admin')
    ? [...baseNavItems, { path: '/app/admin', icon: ShieldCheck, label: 'Admin' }]
    : baseNavItems;

  // Items shown in bottom nav (mobile) - defined in BottomNav component
  const bottomNavPaths = ['/app/capture', '/app/slidedecks', '/app/search', '/app/tiktok-videos'];

  // Primary nav items for desktop
  const desktopPrimaryPaths = ['/app/capture', '/app/slidedecks', '/app/tiktok-videos', '/app/images'];

  // Desktop "More" menu items (excluding search and admin which go on the right)
  const desktopMoreItems = navItems.filter(
    item => !desktopPrimaryPaths.includes(item.path) &&
            item.path !== '/app/search' &&
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
              {/* Primary Nav Items */}
              {navItems
                .filter(item => desktopPrimaryPaths.includes(item.path))
                .map((item) => {
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
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsDesktopMoreOpen(false)}
                          className={`
                            flex items-center gap-3 px-4 py-2 font-medium transition-all
                            ${active
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-100'
                            }
                          `}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Search */}
              {navItems
                .filter(item => item.path === '/app/search')
                .map((item) => {
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
                      <span>Search</span>
                    </Link>
                  );
                })}

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
          <div className="flex items-center justify-center h-14 px-4">
            <Link to="/app/feed" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Brain className="h-7 w-7 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">MC</span>
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
    </div>
  );
}
