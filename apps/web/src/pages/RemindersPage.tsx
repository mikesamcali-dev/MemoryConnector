import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { getRemindersInbox, getUpcomingReminders, markReminderAsRead, dismissReminder } from '../api/reminders';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { Bell, Clock, Check, RefreshCw } from 'lucide-react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { formatDistanceToNow } from 'date-fns';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useNavigate } from 'react-router-dom';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useIsMobile } from '../hooks/useIsMobile';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
// Swipable wrapper component for inbox reminders
function SwipableReminderCard({
  children,
  onDismiss,
  isMobile
}: {
  children: React.ReactNode;
  onDismiss: () => void;
  isMobile: boolean;
}) {
  const { handleTouchStart, handleTouchMove, handleTouchEnd, translateX, isSwiping } = useSwipeGesture({
    threshold: 50,
    onSwipeLeft: () => {
      if (isMobile) {
        onDismiss();
      }
    }
  });

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Dismiss indicator */}
      {translateX < -30 && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-4 bg-red-500">
          <span className="text-white font-medium text-sm">Dismiss</span>
        </div>
      )}

      {/* Card content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${Math.min(0, translateX)}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function RemindersPage() {
    const helpPopup = useHelpPopup('reminders');
const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Get sent reminders (inbox)
  const { data: inboxData, isLoading: loadingInbox, refetch: refetchInbox } = useQuery({
    queryKey: ['reminders', 'inbox'],
    queryFn: getRemindersInbox,
  });

  // Get upcoming reminders
  const { data: upcomingData, isLoading: loadingUpcoming, refetch: refetchUpcoming } = useQuery({
    queryKey: ['reminders', 'upcoming'],
    queryFn: getUpcomingReminders,
  });

  // Pull-to-refresh
  const { isPulling, isRefreshing, pullDistance, handleTouchStart, handleTouchMove, handleTouchEnd } =
    usePullToRefresh({
      onRefresh: async () => {
        await Promise.all([refetchInbox(), refetchUpcoming()]);
      },
    });

  const markReadMutation = useMutation({
    mutationFn: markReminderAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: dismissReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  const isLoading = loadingInbox || loadingUpcoming;
  const hasUpcoming = upcomingData && upcomingData.length > 0;
  const hasInbox = inboxData && inboxData.reminders && inboxData.reminders.length > 0;

  if (isLoading) {
    return <div className="max-w-4xl mx-auto p-6">Loading...</div>;
  }

  if (!hasUpcoming && !hasInbox) {
    return (
      <div
        className="max-w-4xl mx-auto relative"
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
        data-scroll-container
      >
        {/* Pull-to-refresh indicator */}
        {isMobile && (isPulling || isRefreshing) && (
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 transition-all"
            style={{
              transform: `translate(-50%, ${Math.min(pullDistance - 40, 20)}px)`,
              opacity: Math.min(pullDistance / 80, 1)
            }}
          >
            <RefreshCw
              className={`h-6 w-6 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">Reminders</h1>
        <p className="hidden md:block text-gray-600 mb-6">Review your scheduled and past reminders</p>
        <div className="text-center py-8 md:py-12 bg-white rounded-lg border border-gray-200">
          <Bell className="h-10 md:h-12 w-10 md:w-12 mx-auto mb-3 md:mb-4 text-gray-300" />
          <p className="text-sm md:text-base text-gray-500">No reminders yet.</p>
          <p className="text-xs md:text-sm text-gray-400 mt-2">
            Create a memory with type "Word" to get automatic reminders!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-w-4xl mx-auto relative"
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
      data-scroll-container
    >
      {/* Pull-to-refresh indicator */}
      {isMobile && (isPulling || isRefreshing) && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 transition-all z-10"
          style={{
            transform: `translate(-50%, ${Math.min(pullDistance - 40, 20)}px)`,
            opacity: Math.min(pullDistance / 80, 1)
          }}
        >
          <RefreshCw
            className={`h-6 w-6 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </div>
      )}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">Reminders</h1>
      <p className="hidden md:block text-gray-600 mb-6">Review your scheduled and past reminders</p>

      {/* Upcoming Reminders Section */}
      {hasUpcoming && (
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Clock className="h-4 md:h-5 w-4 md:w-5 text-blue-600" />
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
              <span className="md:hidden">Upcoming ({upcomingData.length})</span>
              <span className="hidden md:inline">Upcoming Reminders ({upcomingData.length})</span>
            </h2>
          </div>
          <div className="space-y-2 md:space-y-3">
            {upcomingData.map((reminder: any) => {
              const scheduledDate = new Date(reminder.scheduledAt);
              const isPast = reminder.isOverdue;

              return (
                <div
                  key={reminder.reminderId}
                  className={`p-3 md:p-4 border rounded-lg cursor-pointer hover:shadow-md active:shadow-lg transition-shadow ${
                    isPast ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => navigate(`/app/memories/${reminder.memoryId}`)}
                >
                  <div className="flex items-start justify-between gap-2 md:gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mb-2">
                        {reminder.memoryType && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full w-fit"
                            style={{
                              backgroundColor: reminder.memoryType.color + '20',
                              color: reminder.memoryType.color,
                            }}
                          >
                            <span>{reminder.memoryType.icon}</span>
                            <span className="hidden md:inline">{reminder.memoryType.name}</span>
                          </span>
                        )}
                        <span className={`text-xs font-medium ${isPast ? 'text-red-600' : 'text-blue-600'}`}>
                          {isPast ? 'Overdue' : formatDistanceToNow(scheduledDate, { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 line-clamp-2">{reminder.memoryPreview}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="md:hidden">{scheduledDate.toLocaleDateString()}</span>
                        <span className="hidden md:inline">Scheduled for: {scheduledDate.toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Reminders (Inbox) Section */}
      {hasInbox && (
        <div>
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Check className="h-4 md:h-5 w-4 md:w-5 text-green-600" />
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
              <span className="md:hidden">Past</span>
              <span className="hidden md:inline">Past Reminders</span>
              {inboxData.unreadCount > 0 && (
                <span className="ml-2 text-xs md:text-sm font-normal text-gray-500">
                  ({inboxData.unreadCount} unread)
                </span>
              )}
            </h2>
          </div>
          <div className="space-y-2 md:space-y-3">
            {inboxData.reminders.map((reminder: any) => (
              <SwipableReminderCard
                key={reminder.reminderId}
                isMobile={isMobile}
                onDismiss={() => dismissMutation.mutate(reminder.reminderId)}
              >
                <div
                  className={`p-3 md:p-4 border rounded-lg flex items-start gap-2 md:gap-3 cursor-pointer hover:shadow-md active:shadow-lg transition-shadow ${
                    !reminder.readAt ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                  }`}
                  onClick={() => {
                    if (!reminder.readAt) {
                      markReadMutation.mutate(reminder.reminderId);
                    }
                    navigate(`/app/memories/${reminder.memoryId}`);
                  }}
                >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mb-1">
                    {reminder.memoryType && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 w-fit">
                        {reminder.memoryType}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(reminder.scheduledAt), { addSuffix: true })}
                    </span>
                    {!reminder.readAt && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-600 text-white font-medium w-fit">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-900 line-clamp-2">{reminder.memoryPreview}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissMutation.mutate(reminder.reminderId);
                  }}
                  className="min-w-[48px] min-h-[48px] md:min-w-[40px] md:min-h-[40px] p-2 md:p-1 flex items-center justify-center text-gray-400 hover:text-gray-600 active:text-gray-700 text-xl md:text-lg"
                  aria-label="Dismiss reminder"
                >
                  ×
                </button>
              </div>
              </SwipableReminderCard>
            ))}
          </div>
        </div>
      )}
      {/* Help Popup */}
      <HelpPopup
        pageKey="reminders"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}