import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Brain, Plus, Calendar, TrendingUp, Award, ChevronRight, Sparkles, RefreshCw, FolderKanban } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDueReviews, getReviewStats, getDueCount } from '../api/reviews';
import { searchMemories } from '../api/search';
import { deleteMemory } from '../api/memories';
import { getAllProjects } from '../api/projects';
import { useIsMobile } from '../hooks/useIsMobile';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useHaptics } from '../hooks/useHaptics';
import { SwipeableMemoryCard } from '../components/SwipeableMemoryCard';

export function MindFeedPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { haptic } = useHaptics();
  const isMobile = useIsMobile();
  const [greeting, setGreeting] = useState('');

  // Get current greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMemory,
    onSuccess: () => {
      haptic('success');
      queryClient.invalidateQueries({ queryKey: ['recent-memories'] });
    },
    onError: () => {
      haptic('error');
      alert('Failed to delete memory');
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteMemory(id);
    },
    onSuccess: () => {
      haptic('success');
      queryClient.invalidateQueries({ queryKey: ['recent-memories'] });
    },
    onError: () => {
      haptic('error');
      alert('Failed to archive memory');
    },
  });

  // Fetch review data
  const { data: dueCount } = useQuery({
    queryKey: ['reviews-count'],
    queryFn: getDueCount,
  });

  const { data: reviewStats } = useQuery({
    queryKey: ['review-stats'],
    queryFn: getReviewStats,
  });

  const { data: dueReviews } = useQuery({
    queryKey: ['due-reviews-preview'],
    queryFn: () => getDueReviews(3),
  });

  // Fetch recent memories
  const { data: recentMemories } = useQuery({
    queryKey: ['recent-memories'],
    queryFn: async () => {
      const result = await searchMemories('');
      return result.memories.slice(0, 6);
    },
  });

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: getAllProjects,
  });

  // Get "On This Day" memories from past years
  const { data: onThisDayMemories } = useQuery({
    queryKey: ['on-this-day'],
    queryFn: async () => {
      const today = new Date();
      const monthDay = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      const result = await searchMemories(`created on ${monthDay}`);
      return result.memories.filter(m => {
        const createdYear = new Date(m.createdAt).getFullYear();
        return createdYear < today.getFullYear();
      }).slice(0, 1);
    },
  });

  const firstName = user?.email?.split('@')[0] || 'there';

  // Pull-to-refresh
  const { isPulling, isRefreshing, pullDistance, handleTouchStart, handleTouchMove, handleTouchEnd } =
    usePullToRefresh({
      onRefresh: async () => {
        haptic('light');
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['reviews-count'] }),
          queryClient.invalidateQueries({ queryKey: ['review-stats'] }),
          queryClient.invalidateQueries({ queryKey: ['due-reviews-preview'] }),
          queryClient.invalidateQueries({ queryKey: ['recent-memories'] }),
          queryClient.invalidateQueries({ queryKey: ['on-this-day'] }),
          queryClient.invalidateQueries({ queryKey: ['projects'] }),
        ]);
        haptic('success');
      },
    });

  return (
    <div
      className="max-w-4xl mx-auto space-y-6 pb-8"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-scroll-container
    >
      {/* Pull-to-refresh indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm transition-all"
          style={{
            height: `${Math.min(pullDistance, 80)}px`,
            opacity: Math.min(pullDistance / 80, 1),
          }}
        >
          <RefreshCw
            className={`h-6 w-6 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: `rotate(${pullDistance * 3}deg)`,
            }}
          />
        </div>
      )}
      {/* Greeting Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {greeting}, {firstName}
            </h1>
            <p className="text-gray-600 mt-1">
              {reviewStats?.currentStreakDays ?? 0 > 0 ? (
                <span className="flex items-center gap-1.5">
                  🔥 <span className="font-semibold">{reviewStats?.currentStreakDays}-day streak</span>
                </span>
              ) : (
                <span>Welcome to your Digital Brain</span>
              )}
            </p>
          </div>
          <Link
            to="/app/capture"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Capture</span>
          </Link>
        </div>
      </div>

      {/* Synapse Review Card (SRS) */}
      {dueCount && dueCount.count > 0 && (
        <div className="bg-white rounded-xl shadow-md border-2 border-blue-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-6 w-6" />
                <div>
                  <h2 className="text-lg font-semibold">Synapse Review</h2>
                  <p className="text-sm text-blue-100">
                    {dueCount.count} {dueCount.count === 1 ? 'memory' : 'memories'} ready to review
                  </p>
                </div>
              </div>
              <Link
                to="/app/review"
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium shadow-md"
              >
                Review Now
              </Link>
            </div>
          </div>

          {/* Preview of review items */}
          {dueReviews?.reviews && dueReviews.reviews.length > 0 && (
            <div className="p-4 space-y-2">
              {dueReviews.reviews.slice(0, 3).map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 line-clamp-1">
                      {review.wordLinks && review.wordLinks.length > 0
                        ? `Word: ${review.wordLinks[0].word.word}`
                        : review.title || review.body?.substring(0, 50) || 'Untitled memory'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {review.reviewCount === 0 ? 'Never reviewed' : `Reviewed ${review.reviewCount} times`}
                    </p>
                  </div>
                  <Sparkles className="h-5 w-5 text-blue-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* On This Day */}
      {onThisDayMemories && onThisDayMemories.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">On This Day</h2>
          </div>
          <div className="space-y-3">
            {onThisDayMemories.map((memory) => {
              const yearsDiff = new Date().getFullYear() - new Date(memory.createdAt).getFullYear();

              // Use SwipeableMemoryCard on mobile
              if (isMobile) {
                return (
                  <div key={memory.id} className="relative">
                    <div className="mb-2">
                      <p className="text-xs text-purple-600 font-medium">
                        {yearsDiff} {yearsDiff === 1 ? 'year' : 'years'} ago
                      </p>
                    </div>
                    <SwipeableMemoryCard
                      memory={{
                        id: memory.id,
                        textContent: memory.title || memory.body || 'Untitled',
                        createdAt: memory.createdAt,
                        type: memory.type?.code,
                      }}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      onArchive={(id) => archiveMutation.mutate(id)}
                    />
                  </div>
                );
              }

              // Regular card on desktop
              return (
                <Link
                  key={memory.id}
                  to={`/app/memories/${memory.id}`}
                  className="block p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <p className="text-sm text-purple-600 font-medium mb-1">
                    {yearsDiff} {yearsDiff === 1 ? 'year' : 'years'} ago
                  </p>
                  <p className="text-gray-900 line-clamp-2">
                    {memory.title || memory.body || 'View memory'}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {reviewStats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Recall Rate</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{reviewStats.recallSuccessRate}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {reviewStats.totalReviewsCompleted} total reviews
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Best Streak</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{reviewStats.longestStreakDays}</p>
            <p className="text-xs text-gray-500 mt-1">days in a row</p>
          </div>
        </div>
      )}

      {/* Projects Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-blue-600" />
            Projects
          </h2>
          <Link
            to="/app/projects"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            See All
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                to={`/app/projects/${project.id}`}
                className="group p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg hover:shadow-lg transition-all border border-gray-200 hover:border-blue-300"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{project.name}</h3>
                  <FolderKanban className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                </div>
                {project.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{project._count?.memoryLinks || 0} memories</span>
                  {project.tags && project.tags.length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {project.tags[0]}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FolderKanban className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 mb-4">No projects yet</p>
            <Link
              to="/app/projects"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Link>
          </div>
        )}
      </div>

      {/* Recent Memories Grid */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Memories</h2>
          <Link
            to="/app/search"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            See All
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {recentMemories && recentMemories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {recentMemories.map((memory) => (
              <Link
                key={memory.id}
                to={`/app/memories/${memory.id}`}
                className="group relative aspect-square bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 hover:shadow-lg transition-all border border-gray-200 hover:border-blue-300"
              >
                <div className="h-full flex flex-col justify-between">
                  <p className="text-sm font-medium text-gray-900 line-clamp-3">
                    {memory.title || memory.body || 'Untitled'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(memory.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 mb-4">No memories yet</p>
            <Link
              to="/app/capture"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              Capture Your First Memory
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
