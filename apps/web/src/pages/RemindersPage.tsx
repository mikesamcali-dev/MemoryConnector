import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { getRemindersInbox, getUpcomingReminders, markReminderAsRead, dismissReminder, deleteReminder } from '../api/reminders';
import { Bell, Clock, Check, RefreshCw, Trash2, CheckSquare, Square } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useIsMobile } from '../hooks/useIsMobile';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { useState } from 'react';

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
  const [selectedUpcoming, setSelectedUpcoming] = useState<Set<string>>(new Set());
  const [selectedInbox, setSelectedInbox] = useState<Set<string>>(new Set());

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

  const deleteMutation = useMutation({
    mutationFn: deleteReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  // Helper functions for bulk selection
  const toggleUpcoming = (id: string) => {
    setSelectedUpcoming(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleInbox = (id: string) => {
    setSelectedInbox(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllUpcoming = () => {
    if (upcomingData && selectedUpcoming.size === upcomingData.length) {
      setSelectedUpcoming(new Set());
    } else if (upcomingData) {
      setSelectedUpcoming(new Set(upcomingData.map((r: any) => r.reminderId)));
    }
  };

  const selectAllInbox = () => {
    if (inboxData?.reminders && selectedInbox.size === inboxData.reminders.length) {
      setSelectedInbox(new Set());
    } else if (inboxData?.reminders) {
      setSelectedInbox(new Set(inboxData.reminders.map((r: any) => r.reminderId)));
    }
  };

  const deleteSelected = async (section: 'upcoming' | 'inbox') => {
    const selectedIds = section === 'upcoming' ? selectedUpcoming : selectedInbox;
    if (selectedIds.size === 0) return;

    if (window.confirm(`Delete ${selectedIds.size} selected reminder${selectedIds.size > 1 ? 's' : ''}?`)) {
      for (const id of Array.from(selectedIds)) {
        await deleteMutation.mutateAsync(id);
      }
      if (section === 'upcoming') {
        setSelectedUpcoming(new Set());
      } else {
        setSelectedInbox(new Set());
      }
    }
  };

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
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 md:h-5 w-4 md:w-5 text-blue-600" />
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                <span className="md:hidden">Upcoming ({upcomingData.length})</span>
                <span className="hidden md:inline">Upcoming Reminders ({upcomingData.length})</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllUpcoming}
                className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedUpcoming.size === upcomingData.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedUpcoming.size > 0 && (
                <button
                  onClick={() => deleteSelected('upcoming')}
                  className="text-xs md:text-sm text-red-600 hover:text-red-700 font-medium"
                  disabled={deleteMutation.isPending}
                >
                  Delete ({selectedUpcoming.size})
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2 md:space-y-3">
            {upcomingData.map((reminder: any) => {
              const scheduledDate = new Date(reminder.scheduledAt);
              const isPast = reminder.isOverdue;
              const isSelected = selectedUpcoming.has(reminder.reminderId);

              return (
                <div
                  key={reminder.reminderId}
                  className={`p-3 md:p-4 border rounded-lg hover:shadow-md transition-shadow ${
                    isPast ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-2 md:gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleUpcoming(reminder.reminderId);
                      }}
                      className="mt-1 flex-shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => navigate(`/app/memories/${reminder.memoryId}`)}
                    >
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this reminder?')) {
                          deleteMutation.mutate(reminder.reminderId);
                        }
                      }}
                      className="min-w-[48px] min-h-[48px] md:min-w-[40px] md:min-h-[40px] p-2 md:p-1 flex items-center justify-center text-gray-400 hover:text-red-600 active:text-red-700 transition-colors"
                      aria-label="Delete reminder"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
                    </button>
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
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllInbox}
                className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedInbox.size === inboxData.reminders.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedInbox.size > 0 && (
                <button
                  onClick={() => deleteSelected('inbox')}
                  className="text-xs md:text-sm text-red-600 hover:text-red-700 font-medium"
                  disabled={deleteMutation.isPending}
                >
                  Delete ({selectedInbox.size})
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2 md:space-y-3">
            {inboxData.reminders.map((reminder: any) => {
              const isSelected = selectedInbox.has(reminder.reminderId);

              return (
                <SwipableReminderCard
                  key={reminder.reminderId}
                  isMobile={isMobile}
                  onDismiss={() => dismissMutation.mutate(reminder.reminderId)}
                >
                  <div
                    className={`p-3 md:p-4 border rounded-lg flex items-start gap-2 md:gap-3 hover:shadow-md active:shadow-lg transition-shadow ${
                      !reminder.readAt ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleInbox(reminder.reminderId);
                      }}
                      className="mt-1 flex-shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        if (!reminder.readAt) {
                          markReadMutation.mutate(reminder.reminderId);
                        }
                        navigate(`/app/memories/${reminder.memoryId}`);
                      }}
                    >
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
                    if (window.confirm('Delete this reminder?')) {
                      deleteMutation.mutate(reminder.reminderId);
                    }
                  }}
                  className="min-w-[48px] min-h-[48px] md:min-w-[40px] md:min-h-[40px] p-2 md:p-1 flex items-center justify-center text-gray-400 hover:text-red-600 active:text-red-700 transition-colors"
                  aria-label="Delete reminder"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
                </button>
                  </div>
              </SwipableReminderCard>
            );
            })}
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