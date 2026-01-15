import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCustomReminder } from '../api/reminders';
import { ArrowLeft, Calendar, Clock, Check } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';

export function ReminderSchedulePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { haptic } = useHaptics();
  const queryClient = useQueryClient();

  // Get memoryId from navigation state
  const memoryId = location.state?.memoryId;

  const [selectedOption, setSelectedOption] = useState<'later-today' | 'tomorrow' | 'specific' | null>(null);
  const [specificDate, setSpecificDate] = useState('');
  const [specificTime, setSpecificTime] = useState('09:00');
  const [error, setError] = useState('');

  // Mutation to create custom reminder
  const createReminderMutation = useMutation({
    mutationFn: (scheduledAt: string) => createCustomReminder(memoryId, scheduledAt),
    onSuccess: () => {
      haptic('success');
      queryClient.invalidateQueries({ queryKey: ['upcoming-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['due-reminders-count'] });
      navigate('/app/capture', { state: { reminderCreated: true } });
    },
    onError: (err: any) => {
      haptic('error');
      setError(err.message || 'Failed to create reminder');
    },
  });

  const handleSubmit = () => {
    if (!memoryId) {
      setError('No memory selected');
      return;
    }

    let scheduledAt: Date;
    const now = new Date();

    switch (selectedOption) {
      case 'later-today':
        // Set to 6 PM today
        scheduledAt = new Date(now);
        scheduledAt.setHours(18, 0, 0, 0);
        // If it's already past 6 PM, set to 6 PM tomorrow
        if (scheduledAt <= now) {
          scheduledAt.setDate(scheduledAt.getDate() + 1);
        }
        break;

      case 'tomorrow':
        // Set to 9 AM tomorrow
        scheduledAt = new Date(now);
        scheduledAt.setDate(scheduledAt.getDate() + 1);
        scheduledAt.setHours(9, 0, 0, 0);
        break;

      case 'specific':
        if (!specificDate) {
          setError('Please select a date');
          return;
        }
        // Combine date and time
        const [hours, minutes] = specificTime.split(':').map(Number);
        scheduledAt = new Date(specificDate);
        scheduledAt.setHours(hours, minutes, 0, 0);

        // Validate that the date is in the future
        if (scheduledAt <= now) {
          setError('Please select a future date and time');
          return;
        }
        break;

      default:
        setError('Please select an option');
        return;
    }

    createReminderMutation.mutate(scheduledAt.toISOString());
  };

  const handleSkip = () => {
    navigate('/app/capture');
  };

  if (!memoryId) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          No memory selected. Please go back to the capture page.
        </div>
        <button
          onClick={() => navigate('/app/capture')}
          className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Capture
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleSkip}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Skip
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Set Reminder
        </h1>
        <p className="text-gray-600">
          When would you like to be reminded about this memory?
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Options */}
      <div className="space-y-3 mb-6">
        {/* Later Today */}
        <button
          onClick={() => {
            setSelectedOption('later-today');
            setError('');
          }}
          className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
            selectedOption === 'later-today'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Later Today</div>
              <div className="text-sm text-gray-500">Remind me at 6:00 PM</div>
            </div>
          </div>
          {selectedOption === 'later-today' && (
            <Check className="h-5 w-5 text-blue-600" />
          )}
        </button>

        {/* Tomorrow */}
        <button
          onClick={() => {
            setSelectedOption('tomorrow');
            setError('');
          }}
          className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
            selectedOption === 'tomorrow'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Tomorrow</div>
              <div className="text-sm text-gray-500">Remind me at 9:00 AM tomorrow</div>
            </div>
          </div>
          {selectedOption === 'tomorrow' && (
            <Check className="h-5 w-5 text-blue-600" />
          )}
        </button>

        {/* Specific Date */}
        <button
          onClick={() => {
            setSelectedOption('specific');
            setError('');
          }}
          className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
            selectedOption === 'specific'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Specific Date</div>
              <div className="text-sm text-gray-500">Choose a custom date and time</div>
            </div>
          </div>
          {selectedOption === 'specific' && (
            <Check className="h-5 w-5 text-blue-600" />
          )}
        </button>
      </div>

      {/* Specific Date/Time Picker */}
      {selectedOption === 'specific' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time
              </label>
              <input
                type="time"
                value={specificTime}
                onChange={(e) => setSpecificTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSkip}
          className="flex-1 h-12 px-6 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
        >
          Skip for Now
        </button>
        <button
          onClick={handleSubmit}
          disabled={!selectedOption || createReminderMutation.isPending}
          className="flex-1 h-12 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {createReminderMutation.isPending ? 'Creating...' : 'Set Reminder'}
        </button>
      </div>
    </div>
  );
}
