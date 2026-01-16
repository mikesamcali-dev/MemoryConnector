import { useState, useMemo } from 'react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useNavigate } from 'react-router-dom';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { ArrowLeft, Check, Presentation, Calendar, Search, Loader } from 'lucide-react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { getRecentRemindersForSelection, createSlideDeckFromSelected } from '../api/slidedecks';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { format, isPast } from 'date-fns';

import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
interface ReminderForSelection {
  id: string;
  memoryId: string;
  scheduledAt: string;
  status: string;
  memoryPreview: string;
}

export function SlideDeckReminderSelectionPage() {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch recent reminders
  const { data: reminders, isLoading, error } = useQuery<ReminderForSelection[]>({
    queryKey: ['recent-reminders-for-selection'],
    queryFn: getRecentRemindersForSelection,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (reminderIds: string[]) => createSlideDeckFromSelected(reminderIds),
    onSuccess: (newDeck) => {
      navigate(`/app/slidedecks/${newDeck.id}/view`);
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // Filter reminders based on search query
  const filteredReminders = useMemo(() => {
    if (!reminders) return [];
    if (!searchQuery.trim()) return reminders;

    const query = searchQuery.toLowerCase();
    return reminders.filter((reminder) =>
      reminder.memoryPreview.toLowerCase().includes(query)
    );
  }, [reminders, searchQuery]);

  // Group reminders by duplicate memory IDs
  const remindersByMemory = useMemo(() => {
    const map = new Map<string, ReminderForSelection[]>();
    filteredReminders.forEach((reminder) => {
      const existing = map.get(reminder.memoryId) || [];
      existing.push(reminder);
      map.set(reminder.memoryId, existing);
    });
    return map;
  }, [filteredReminders]);

  // Get unique reminders (one per memory)
  const uniqueReminders = useMemo(() => {
    return Array.from(remindersByMemory.values()).map((group) => group[0]);
  }, [remindersByMemory]);

  const handleToggle = (reminderId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reminderId)) {
        newSet.delete(reminderId);
      } else {
        newSet.add(reminderId);
      }
      return newSet;
    });
  };

  const handleToggleAll = () => {
    if (selectedIds.size === uniqueReminders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(uniqueReminders.map((r) => r.id)));
    }
  };

  const handleCreate = () => {
    if (selectedIds.size === 0) {
      alert('Please select at least one reminder');
      return;
    }
    createMutation.mutate(Array.from(selectedIds));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reminders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load reminders</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/app/slidedecks')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm md:text-base"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Slide Decks
        </button>

        <div className="flex items-center gap-2 md:gap-3 mb-2">
          <Presentation className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Select Reminders</h1>
        </div>
        <p className="text-gray-600 text-sm md:text-base">
          Choose which reminders to include in your slide deck
        </p>
      </div>

      {/* Search Bar */}
      {reminders && reminders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reminders by content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredReminders.length} reminder{filteredReminders.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Action Bar */}
      {uniqueReminders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleAll}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              {selectedIds.size === uniqueReminders.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-sm text-gray-600">
              {selectedIds.size} of {uniqueReminders.length} selected
            </span>
          </div>

          <button
            onClick={handleCreate}
            disabled={selectedIds.size === 0 || createMutation.isPending}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm md:text-base font-medium"
          >
            {createMutation.isPending ? (
              <>
                <Loader className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Presentation className="w-4 h-4 md:w-5 md:h-5" />
                <span>Create Slide Deck ({selectedIds.size})</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Reminders List */}
      {!reminders || reminders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Presentation className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
            No reminders found
          </h3>
          <p className="text-sm md:text-base text-gray-500 mb-4 px-4">
            You don't have any reminders to create a slide deck from
          </p>
          <button
            onClick={() => navigate('/app/slidedecks')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Slide Decks
          </button>
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Search className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
            No reminders match your search
          </h3>
          <p className="text-sm md:text-base text-gray-500 px-4">
            Try different keywords
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {uniqueReminders.map((reminder) => {
            const isSelected = selectedIds.has(reminder.id);
            const isDue = isPast(new Date(reminder.scheduledAt));
            const duplicateCount = remindersByMemory.get(reminder.memoryId)?.length || 0;

            return (
              <div
                key={reminder.id}
                onClick={() => handleToggle(reminder.id)}
                className={`
                  bg-white rounded-lg shadow-sm border-2 p-4 cursor-pointer transition-all
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div className="flex-shrink-0 pt-1">
                    <div
                      className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                        ${isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white border-gray-300'
                        }
                      `}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 line-clamp-3 text-sm md:text-base mb-2">
                      {reminder.memoryPreview}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                      {/* Scheduled Date */}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                        <span className={isDue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {format(new Date(reminder.scheduledAt), 'MMM d, yyyy')}
                        </span>
                      </div>

                      {/* Overdue Badge */}
                      {isDue && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          Overdue
                        </span>
                      )}

                      {/* Duplicate Warning */}
                      {duplicateCount > 1 && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          {duplicateCount} reminders (will use 1)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Help Popup */}
      <HelpPopup
        pageKey="slidedecks"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}