import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsageStats } from '../api/usage';
import { getMemories, deleteMemory } from '../api/memories';
import { getReminderPreferences, updateReminderPreferences, minutesToDisplay, parseToMinutes } from '../api/userPreferences';
import { resetAllHelpViews } from '../api/helpViews';
import { getUserMemoryProfile, updateUserMemoryProfile } from '../api/userMemory';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Edit, TrendingUp, Calendar, Bell, HelpCircle, User } from 'lucide-react';
import { useState, useEffect } from 'react';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const helpPopup = useHelpPopup('settings');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Reminder preferences state
  const [editingReminders, setEditingReminders] = useState(false);
  const [firstValue, setFirstValue] = useState(3);
  const [firstUnit, setFirstUnit] = useState<'minutes' | 'hours' | 'days' | 'weeks'>('minutes');
  const [secondValue, setSecondValue] = useState(3);
  const [secondUnit, setSecondUnit] = useState<'minutes' | 'hours' | 'days' | 'weeks'>('days');
  const [thirdValue, setThirdValue] = useState(3);
  const [thirdUnit, setThirdUnit] = useState<'minutes' | 'hours' | 'days' | 'weeks'>('weeks');
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  // Profile settings state
  const [editingProfile, setEditingProfile] = useState(false);
  const [learningStyle, setLearningStyle] = useState<'VISUAL' | 'HANDS_ON' | 'THEORETICAL' | 'MIXED'>('MIXED');
  const [skillLevel, setSkillLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');
  const [primaryGoal, setPrimaryGoal] = useState<'RETENTION' | 'LEARNING' | 'ORGANIZATION' | 'HABIT_BUILDING'>('RETENTION');
  const [dailyTimeCommitment, setDailyTimeCommitment] = useState(10);
  const [preferredPace, setPreferredPace] = useState<'INTENSIVE' | 'MODERATE' | 'GRADUAL'>('MODERATE');
  const [preferredReviewTime, setPreferredReviewTime] = useState<string | null>(null);
  const [areasOfInterest, setAreasOfInterest] = useState<string[]>([]);

  // Fetch usage stats
  const { data: usageStats, isLoading: loadingStats } = useQuery({
    queryKey: ['usage-stats'],
    queryFn: getUsageStats,
  });

  // Fetch memories
  const { data: memories, isLoading: loadingMemories } = useQuery({
    queryKey: ['user-memories'],
    queryFn: () => getMemories(0, 50),
  });

  // Fetch reminder preferences
  const { data: preferences } = useQuery({
    queryKey: ['reminder-preferences'],
    queryFn: getReminderPreferences,
  });

  // Fetch user memory profile
  const { data: memoryProfile } = useQuery({
    queryKey: ['user-memory-profile'],
    queryFn: getUserMemoryProfile,
  });

  // Update preferences when loaded
  useEffect(() => {
    if (preferences) {
      setRemindersEnabled(preferences.remindersEnabled);
      // Parse intervals to friendly units
      // First reminder (default 3 minutes)
      if (preferences.firstReminderMinutes < 60) {
        setFirstValue(preferences.firstReminderMinutes);
        setFirstUnit('minutes');
      } else if (preferences.firstReminderMinutes < 1440) {
        setFirstValue(Math.floor(preferences.firstReminderMinutes / 60));
        setFirstUnit('hours');
      } else if (preferences.firstReminderMinutes < 10080) {
        setFirstValue(Math.floor(preferences.firstReminderMinutes / 1440));
        setFirstUnit('days');
      } else {
        setFirstValue(Math.floor(preferences.firstReminderMinutes / 10080));
        setFirstUnit('weeks');
      }
      // Second reminder (default 3 days)
      if (preferences.secondReminderMinutes < 60) {
        setSecondValue(preferences.secondReminderMinutes);
        setSecondUnit('minutes');
      } else if (preferences.secondReminderMinutes < 1440) {
        setSecondValue(Math.floor(preferences.secondReminderMinutes / 60));
        setSecondUnit('hours');
      } else if (preferences.secondReminderMinutes < 10080) {
        setSecondValue(Math.floor(preferences.secondReminderMinutes / 1440));
        setSecondUnit('days');
      } else {
        setSecondValue(Math.floor(preferences.secondReminderMinutes / 10080));
        setSecondUnit('weeks');
      }
      // Third reminder (default 3 weeks)
      if (preferences.thirdReminderMinutes < 60) {
        setThirdValue(preferences.thirdReminderMinutes);
        setThirdUnit('minutes');
      } else if (preferences.thirdReminderMinutes < 1440) {
        setThirdValue(Math.floor(preferences.thirdReminderMinutes / 60));
        setThirdUnit('hours');
      } else if (preferences.thirdReminderMinutes < 10080) {
        setThirdValue(Math.floor(preferences.thirdReminderMinutes / 1440));
        setThirdUnit('days');
      } else {
        setThirdValue(Math.floor(preferences.thirdReminderMinutes / 10080));
        setThirdUnit('weeks');
      }
    }
  }, [preferences]);

  // Update profile settings when loaded
  useEffect(() => {
    if (memoryProfile) {
      setLearningStyle(memoryProfile.learningStyle);
      setSkillLevel(memoryProfile.skillLevel);
      setPrimaryGoal(memoryProfile.primaryGoal);
      setDailyTimeCommitment(memoryProfile.dailyTimeCommitment);
      setPreferredPace(memoryProfile.preferredPace);
      setPreferredReviewTime(memoryProfile.preferredReviewTime);
      setAreasOfInterest(memoryProfile.areasOfInterest);
    }
  }, [memoryProfile]);

  // Update preferences mutation
  const updatePrefsMutation = useMutation({
    mutationFn: updateReminderPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-preferences'] });
      setEditingReminders(false);
    },
  });

  const handleSaveReminders = () => {
    updatePrefsMutation.mutate({
      firstReminderMinutes: parseToMinutes(firstValue, firstUnit),
      secondReminderMinutes: parseToMinutes(secondValue, secondUnit),
      thirdReminderMinutes: parseToMinutes(thirdValue, thirdUnit),
      remindersEnabled,
    });
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateUserMemoryProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-memory-profile'] });
      setEditingProfile(false);
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      learningStyle,
      skillLevel,
      primaryGoal,
      dailyTimeCommitment,
      preferredPace,
      preferredReviewTime,
      areasOfInterest,
    });
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMemory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-memories'] });
      queryClient.invalidateQueries({ queryKey: ['usage-stats'] });
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      setDeleteConfirmId(null);
    },
  });

  // Reset help views mutation
  const resetHelpViewsMutation = useMutation({
    mutationFn: resetAllHelpViews,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-view-state'] });
      alert('All help popups have been reset and will show again!');
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-3 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-8">Settings</h1>

      <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Account Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Account</h2>
          <div className="space-y-2">
            <p className="text-xs md:text-sm text-gray-600">
              <span className="font-medium">Email:</span> <span className="break-all">{user?.email}</span>
            </p>
            <p className="text-xs md:text-sm text-gray-600">
              <span className="font-medium">Tier:</span>{' '}
              <span className="capitalize inline-flex items-center gap-2">
                {user?.tier}
                {user?.tier === 'free' && (
                  <Link
                    to="/app/upgrade"
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    Upgrade
                  </Link>
                )}
              </span>
            </p>
          </div>
          <button
            onClick={logout}
            className="mt-4 md:mt-6 w-full md:w-auto h-12 md:h-10 px-4 md:px-3 py-2 bg-red-600 text-white text-base md:text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Logout
          </button>
        </div>

        {/* Usage Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 md:h-5 w-4 md:w-5 text-blue-600" />
            <span className="hidden md:inline">Usage Statistics</span>
            <span className="md:hidden">Usage</span>
          </h2>
          {loadingStats ? (
            <p className="text-sm text-gray-600">Loading...</p>
          ) : usageStats ? (
            <div className="space-y-2 md:space-y-3">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-700">Memories Today</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl md:text-2xl font-bold text-gray-900">
                    {usageStats.memories_today}
                  </span>
                  <span className="text-xs md:text-sm text-gray-600">
                    / {usageStats.memories_per_day === -1 ? '∞' : usageStats.memories_per_day}
                  </span>
                </div>
                <div className="mt-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (usageStats.memories_today / (usageStats.memories_per_day || 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs md:text-sm font-medium text-gray-700">Memories This Month</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl md:text-2xl font-bold text-gray-900">
                    {usageStats.memories_this_month}
                  </span>
                  <span className="text-xs md:text-sm text-gray-600">
                    / {usageStats.memories_per_month === -1 ? '∞' : usageStats.memories_per_month}
                  </span>
                </div>
                <div className="mt-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (usageStats.memories_this_month / (usageStats.memories_per_month || 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700">Searches Today</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {usageStats.searches_today}
                  </span>
                  <span className="text-xs text-gray-600">
                    / {usageStats.searches_per_day === -1 ? '∞' : usageStats.searches_per_day}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-red-600">Failed to load usage stats</p>
          )}
        </div>
      </div>

      {/* Profile Settings */}
      {memoryProfile && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
              <User className="h-4 md:h-5 w-4 md:w-5 text-blue-600" />
              <span className="hidden md:inline">Learning Profile</span>
              <span className="md:hidden">Profile</span>
            </h2>
            {!editingProfile && (
              <button
                onClick={() => setEditingProfile(true)}
                className="h-12 md:h-10 px-4 md:px-3 py-2 text-base md:text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Edit
              </button>
            )}
          </div>

          {!editingProfile ? (
            // View Mode
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Learning Style</span>
                <span className="font-medium capitalize">{memoryProfile.learningStyle.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Skill Level</span>
                <span className="font-medium capitalize">{memoryProfile.skillLevel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Primary Goal</span>
                <span className="font-medium capitalize">{memoryProfile.primaryGoal.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Daily Time Commitment</span>
                <span className="font-medium">{memoryProfile.dailyTimeCommitment} minutes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Preferred Pace</span>
                <span className="font-medium capitalize">{memoryProfile.preferredPace}</span>
              </div>
              {memoryProfile.preferredReviewTime && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Best Review Time</span>
                  <span className="font-medium capitalize">{memoryProfile.preferredReviewTime}</span>
                </div>
              )}
              {memoryProfile.areasOfInterest.length > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-700 block mb-2">Areas of Interest</span>
                  <div className="flex flex-wrap gap-2">
                    {memoryProfile.areasOfInterest.map((area) => (
                      <span key={area} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Edit Mode
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Learning Style</label>
                <select
                  value={learningStyle}
                  onChange={(e) => setLearningStyle(e.target.value as any)}
                  className="w-full h-12 md:h-10 px-3 py-2 border border-gray-300 rounded-md text-base md:text-sm"
                >
                  <option value="VISUAL">Visual</option>
                  <option value="HANDS_ON">Hands-On</option>
                  <option value="THEORETICAL">Theoretical</option>
                  <option value="MIXED">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skill Level</label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value as any)}
                  className="w-full h-12 md:h-10 px-3 py-2 border border-gray-300 rounded-md text-base md:text-sm"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Goal</label>
                <select
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value as any)}
                  className="w-full h-12 md:h-10 px-3 py-2 border border-gray-300 rounded-md text-base md:text-sm"
                >
                  <option value="RETENTION">Long-term Retention</option>
                  <option value="LEARNING">Fast Learning</option>
                  <option value="ORGANIZATION">Organization</option>
                  <option value="HABIT_BUILDING">Build Habits</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Daily Time Commitment (minutes)</label>
                <select
                  value={dailyTimeCommitment}
                  onChange={(e) => setDailyTimeCommitment(Number(e.target.value))}
                  className="w-full h-12 md:h-10 px-3 py-2 border border-gray-300 rounded-md text-base md:text-sm"
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60+ minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Pace</label>
                <select
                  value={preferredPace}
                  onChange={(e) => setPreferredPace(e.target.value as any)}
                  className="w-full h-12 md:h-10 px-3 py-2 border border-gray-300 rounded-md text-base md:text-sm"
                >
                  <option value="INTENSIVE">Intensive</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="GRADUAL">Gradual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Best Review Time</label>
                <div className="grid grid-cols-2 gap-2">
                  {['morning', 'afternoon', 'evening', 'flexible'].map((time) => (
                    <button
                      key={time}
                      onClick={() => setPreferredReviewTime(time)}
                      className={`p-3 rounded-lg border-2 transition-all capitalize text-sm ${
                        preferredReviewTime === time
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Areas of Interest</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Work & Professional',
                    'People & Relationships',
                    'Health & Wellness',
                    'Learning & Education',
                    'Hobbies & Interests',
                    'Personal Development',
                  ].map((area) => (
                    <button
                      key={area}
                      onClick={() => {
                        const newAreas = areasOfInterest.includes(area)
                          ? areasOfInterest.filter((a) => a !== area)
                          : [...areasOfInterest, area];
                        setAreasOfInterest(newAreas);
                      }}
                      className={`p-3 rounded-lg border-2 transition-all text-sm ${
                        areasOfInterest.includes(area)
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="h-12 md:h-10 px-4 md:px-3 py-2 bg-blue-600 text-white text-base md:text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingProfile(false)}
                  className="h-12 md:h-10 px-4 md:px-3 py-2 bg-gray-200 text-gray-700 text-base md:text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reminder Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
            <Bell className="h-4 md:h-5 w-4 md:w-5 text-blue-600" />
            <span className="hidden md:inline">Reminder Settings</span>
            <span className="md:hidden">Reminders</span>
          </h2>
          {!editingReminders && (
            <button
              onClick={() => setEditingReminders(true)}
              className="h-12 md:h-10 px-4 md:px-3 py-2 text-base md:text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit
            </button>
          )}
        </div>

        {!editingReminders ? (
          // View Mode
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Reminders enabled</span>
              <span className="font-medium">{preferences?.remindersEnabled ? 'Yes' : 'No'}</span>
            </div>
            {preferences?.remindersEnabled && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">First reminder</span>
                  <span className="font-medium">{minutesToDisplay(preferences?.firstReminderMinutes)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Second reminder</span>
                  <span className="font-medium">{minutesToDisplay(preferences?.secondReminderMinutes)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Third reminder</span>
                  <span className="font-medium">{minutesToDisplay(preferences?.thirdReminderMinutes)}</span>
                </div>
              </>
            )}
          </div>
        ) : (
          // Edit Mode
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="remindersEnabled"
                checked={remindersEnabled}
                onChange={(e) => setRemindersEnabled(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="remindersEnabled" className="text-gray-700">
                Enable automatic reminders for all memories
              </label>
            </div>

            {remindersEnabled && (
              <>
                <div>
                  <label className="hidden md:block text-sm font-medium text-gray-700 mb-2">First reminder</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={firstValue}
                      onChange={(e) => setFirstValue(parseInt(e.target.value) || 1)}
                      placeholder="1st"
                      className="w-24 h-12 md:h-10 px-3 py-2 border border-gray-300 rounded-md text-base md:text-sm"
                    />
                    <select
                      value={firstUnit}
                      onChange={(e) => setFirstUnit(e.target.value as any)}
                      className="h-12 md:h-10 px-3 py-2 border border-gray-300 rounded-md text-base md:text-sm"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="hidden md:block text-sm font-medium text-gray-700 mb-2">Second reminder</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={secondValue}
                      onChange={(e) => setSecondValue(parseInt(e.target.value) || 1)}
                      placeholder="2nd"
                      className="w-24 h-12 md:h-10 px-3 py-2 border border-gray-300 rounded-md text-base md:text-sm"
                    />
                    <select
                      value={secondUnit}
                      onChange={(e) => setSecondUnit(e.target.value as any)}
                      className="h-12 md:h-10 px-3 py-2 border border-gray-300 rounded-md text-base md:text-sm"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="hidden md:block text-sm font-medium text-gray-700 mb-2">Third reminder</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={thirdValue}
                      onChange={(e) => setThirdValue(parseInt(e.target.value) || 1)}
                      placeholder="3rd"
                      className="w-24 h-12 md:h-10 px-3 py-2 border border-gray-300 rounded-md text-base md:text-sm"
                    />
                    <select
                      value={thirdUnit}
                      onChange={(e) => setThirdUnit(e.target.value as any)}
                      className="h-12 md:h-10 px-3 py-2 border border-gray-300 rounded-md text-base md:text-sm"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveReminders}
                disabled={updatePrefsMutation.isPending}
                className="h-12 md:h-10 px-4 md:px-3 py-2 bg-blue-600 text-white text-base md:text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {updatePrefsMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditingReminders(false)}
                className="h-12 md:h-10 px-4 md:px-3 py-2 bg-gray-200 text-gray-700 text-base md:text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help Popups Reset */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div>
            <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
              <HelpCircle className="h-4 md:h-5 w-4 md:w-5 text-blue-600" />
              <span>Help Popups</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Reset all help popups to show again on each page (max 3 times per page)
            </p>
          </div>
        </div>

        <button
          onClick={() => resetHelpViewsMutation.mutate()}
          disabled={resetHelpViewsMutation.isPending}
          className="h-12 md:h-10 px-4 md:px-3 py-2 bg-blue-600 text-white text-base md:text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {resetHelpViewsMutation.isPending ? 'Resetting...' : 'Reset My Helpers'}
        </button>
      </div>

      {/* Recent Memories */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-4 md:h-5 w-4 md:w-5 text-blue-600" />
            <span className="hidden md:inline">Your Memories ({memories?.length || 0})</span>
            <span className="md:hidden">Memories ({memories?.length || 0})</span>
          </h2>
          <Link
            to="/app/capture"
            className="text-xs md:text-sm bg-blue-600 text-white px-2 md:px-3 py-1.5 rounded hover:bg-blue-700"
          >
            <span className="hidden md:inline">Add New</span>
            <span className="md:inline">+</span>
          </Link>
        </div>

        {loadingMemories ? (
          <p className="text-sm text-gray-600">Loading memories...</p>
        ) : memories && memories.length > 0 ? (
          <div className="space-y-2 md:max-h-96 md:overflow-y-auto">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="flex items-start justify-between gap-2 md:gap-4 p-2 md:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-gray-900 line-clamp-2">
                    {memory.textContent || '(No text)'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(memory.createdAt)}</p>
                  {memory.type && (
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1"
                      style={{
                        backgroundColor: memory.type.color + '20',
                        color: memory.type.color,
                      }}
                    >
                      <span>{memory.type.icon}</span>
                      <span className="hidden md:inline">{memory.type.label}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/app/memories/${memory.id}`)}
                    className="min-w-[48px] min-h-[48px] md:min-w-[40px] md:min-h-[40px] p-2 flex items-center justify-center text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-md transition-colors"
                    title="View/Edit"
                  >
                    <Edit className="h-5 w-5 md:h-4 md:w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(memory.id)}
                    className="min-w-[48px] min-h-[48px] md:min-w-[40px] md:min-h-[40px] p-2 flex items-center justify-center text-red-600 hover:bg-red-50 active:bg-red-100 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No memories yet</p>
            <Link
              to="/app/capture"
              className="inline-block h-12 md:h-10 px-4 md:px-3 py-2 bg-blue-600 text-white text-base md:text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
            >
              <span className="hidden md:inline">Create Your First Memory</span>
              <span className="md:hidden">Create Memory</span>
            </Link>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Memory?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this memory? This will free up a slot in your daily limit.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="h-12 md:h-10 px-4 md:px-3 py-2 bg-gray-200 text-gray-800 text-base md:text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                className="h-12 md:h-10 px-4 md:px-3 py-2 bg-red-600 text-white text-base md:text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Popup */}
      <HelpPopup
        pageKey="settings"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />
    </div>
  );
}
