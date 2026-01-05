import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Brain,
  Calendar,
  Image as ImageIcon,
  Link as LinkIcon,
  Video,
  Film,
  Presentation,
  MapPin,
  User,
  Clock,
  TrendingUp,
  Plus,
  ChevronRight,
  FolderKanban
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getMemories } from '../api/memories';
import { getUpcomingReminders } from '../api/reminders';
import { getUserUrlPages } from '../api/urlPages';

export function DashboardPage() {
  const { user } = useAuth();

  // Fetch recent memories
  const { data: memoriesData } = useQuery({
    queryKey: ['recent-memories'],
    queryFn: async () => {
      // Fetch a large set to get accurate count (adjust as needed)
      const memories = await getMemories(0, 100);
      console.log('Dashboard memories data:', { count: memories.length });
      return {
        total: memories.length,
        recent: memories.slice(0, 5),
      };
    },
    // Disable caching so it refetches on page navigation
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  // Fetch upcoming reminders
  const { data: reminders } = useQuery({
    queryKey: ['upcoming-reminders'],
    queryFn: () => getUpcomingReminders(),
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch recent URLs
  const { data: urlPages } = useQuery({
    queryKey: ['recent-urls'],
    queryFn: async () => {
      const pages = await getUserUrlPages();
      return pages.slice(0, 5);
    },
    staleTime: 0,
    gcTime: 0,
  });

  const firstName = user?.email?.split('@')[0] || 'there';
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const accountAge = user ? 'Active' : 'N/A';

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Memories',
      value: memoriesData?.total || 0,
      icon: Brain,
      color: 'blue',
      link: '/app/search',
    },
    {
      title: 'Reminders',
      value: reminders?.length || 0,
      icon: Calendar,
      color: 'purple',
      link: '/app/reminders',
    },
    {
      title: 'URL Pages',
      value: urlPages?.length || 0,
      icon: LinkIcon,
      color: 'green',
      link: '/app/urls',
    },
  ];

  const quickActions = [
    { label: 'Capture Memory', icon: Plus, link: '/app/capture', color: 'blue' },
    { label: 'View Slides', icon: Presentation, link: '/app/slidedecks', color: 'purple' },
    { label: 'Browse Images', icon: ImageIcon, link: '/app/images', color: 'pink' },
    { label: 'TikTok Videos', icon: Film, link: '/app/tiktok-videos', color: 'red' },
    { label: 'YouTube Videos', icon: Video, link: '/app/youtube-videos', color: 'orange' },
    { label: 'Locations', icon: MapPin, link: '/app/locations', color: 'green' },
    { label: 'People', icon: User, link: '/app/people', color: 'indigo' },
    { label: 'Projects', icon: FolderKanban, link: '/app/projects', color: 'teal' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 md:p-8 text-white shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {greeting}, {firstName}!
        </h1>
        <p className="text-blue-100 text-sm md:text-base">
          Welcome back to your Memory Connector
        </p>
        <div className="mt-4 flex items-center gap-4 text-sm text-blue-100">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Account {accountAge}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="capitalize">{user?.tier || 'free'} tier</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((stat) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 bg-${stat.color}-100 rounded-lg`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.link}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className={`p-3 bg-${action.color}-100 rounded-full`}>
                <action.icon className={`h-5 w-5 text-${action.color}-600`} />
              </div>
              <span className="text-xs md:text-sm font-medium text-gray-700 text-center">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Memories */}
      {memoriesData && memoriesData.recent.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Memories</h2>
            <Link
              to="/app/search"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {memoriesData.recent.map((memory) => (
              <Link
                key={memory.id}
                to={`/app/memories/${memory.id}`}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 line-clamp-2">
                      {memory.title || memory.body || 'Untitled memory'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(memory.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {memory.type && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full whitespace-nowrap">
                      {memory.type.label}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Reminders */}
      {reminders && reminders.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Reminders</h2>
            <Link
              to="/app/reminders"
              className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <Link
                key={reminder.reminderId}
                to={`/app/memories/${reminder.memoryId}`}
                className="block p-4 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {reminder.memoryPreview || 'Reminder'}
                    </p>
                    {reminder.scheduledAt && (
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(reminder.scheduledAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent URLs */}
      {urlPages && urlPages.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent URLs</h2>
            <Link
              to="/app/urls"
              className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {urlPages.map((urlPage) => (
              <a
                key={urlPage.id}
                href={urlPage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <LinkIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 line-clamp-1">
                      {urlPage.title || 'Untitled'}
                    </p>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {urlPage.url}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
