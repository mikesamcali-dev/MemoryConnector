import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRemindersInbox, getUpcomingReminders, markReminderAsRead, dismissReminder } from '../api/reminders';
import { Bell, Clock, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function RemindersPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get sent reminders (inbox)
  const { data: inboxData, isLoading: loadingInbox } = useQuery({
    queryKey: ['reminders', 'inbox'],
    queryFn: getRemindersInbox,
  });

  // Get upcoming reminders
  const { data: upcomingData, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['reminders', 'upcoming'],
    queryFn: getUpcomingReminders,
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reminders</h1>
        <p className="text-gray-600 mb-6">Review your scheduled and past reminders</p>
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No reminders yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            Create a memory with type "Word" to get automatic reminders!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Reminders</h1>
      <p className="text-gray-600 mb-6">Review your scheduled and past reminders</p>

      {/* Upcoming Reminders Section */}
      {hasUpcoming && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Upcoming Reminders ({upcomingData.length})
            </h2>
          </div>
          <div className="space-y-3">
            {upcomingData.map((reminder: any) => {
              const scheduledDate = new Date(reminder.scheduledAt);
              const isPast = reminder.isOverdue;

              return (
                <div
                  key={reminder.reminderId}
                  className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                    isPast ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => navigate(`/app/memories/${reminder.memoryId}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {reminder.memoryType && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
                            style={{
                              backgroundColor: reminder.memoryType.color + '20',
                              color: reminder.memoryType.color,
                            }}
                          >
                            <span>{reminder.memoryType.icon}</span>
                            <span>{reminder.memoryType.name}</span>
                          </span>
                        )}
                        <span className={`text-xs font-medium ${isPast ? 'text-red-600' : 'text-blue-600'}`}>
                          {isPast ? 'Overdue' : formatDistanceToNow(scheduledDate, { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">{reminder.memoryPreview}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Scheduled for: {scheduledDate.toLocaleString()}
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
          <div className="flex items-center gap-2 mb-4">
            <Check className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Past Reminders
              {inboxData.unreadCount > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({inboxData.unreadCount} unread)
                </span>
              )}
            </h2>
          </div>
          <div className="space-y-3">
            {inboxData.reminders.map((reminder: any) => (
              <div
                key={reminder.reminderId}
                className={`p-4 border rounded-lg flex items-start gap-3 cursor-pointer hover:shadow-md transition-shadow ${
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
                  <div className="flex items-center gap-2 mb-1">
                    {reminder.memoryType && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                        {reminder.memoryType}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(reminder.scheduledAt), { addSuffix: true })}
                    </span>
                    {!reminder.readAt && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-600 text-white font-medium">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-900">{reminder.memoryPreview}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissMutation.mutate(reminder.reminderId);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  aria-label="Dismiss reminder"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

