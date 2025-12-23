import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRemindersInbox, markReminderAsRead, dismissReminder } from '../api/reminders';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function RemindersPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reminders', 'inbox'],
    queryFn: getRemindersInbox,
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

  if (isLoading) {
    return <div className="max-w-4xl mx-auto p-6">Loading...</div>;
  }

  if (!data || data.reminders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Reminders</h1>
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No reminders yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            We'll remind you to revisit your memories over time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Reminders
        {data.unreadCount > 0 && (
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({data.unreadCount} unread)
          </span>
        )}
      </h1>

      <div className="space-y-2">
        {data.reminders.map((reminder: any) => (
          <div
            key={reminder.reminderId}
            className={`p-4 border rounded-lg flex items-start gap-3 ${
              !reminder.readAt ? 'bg-blue-50' : 'bg-white'
            }`}
            onClick={() => !reminder.readAt && markReadMutation.mutate(reminder.reminderId)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                  {reminder.memoryType || 'note'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(reminder.scheduledAt), { addSuffix: true })}
                </span>
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
  );
}

