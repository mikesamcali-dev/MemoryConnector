import { useState, useEffect } from 'react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useParams, useNavigate } from 'react-router-dom';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useForm } from 'react-hook-form';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { zodResolver } from '@hookform/resolvers/zod';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { z } from 'zod';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { getMemory, updateMemory, deleteMemory, analyzeText, WordMatch, linkWordsToMemory } from '../api/memories';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { getRemindersForMemory, updateReminderSchedule, deleteReminder, createSRSReminders } from '../api/reminders';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { ArrowLeft, Save, MapPin, Calendar, Edit2, X, Clock, Trash2, Plus, Link2, BookOpen, Image as ImageIcon, ExternalLink, Bell, MessageSquare } from 'lucide-react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { EntitySuggestionsModal } from '../components/EntitySuggestionsModal';

import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
const updateMemorySchema = z.object({
  textContent: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export function MemoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [editingReminderTime, setEditingReminderTime] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [detectedWords, setDetectedWords] = useState<WordMatch[]>([]);
  const [showWordModal, setShowWordModal] = useState(false);
  const [analyzingWords, setAnalyzingWords] = useState(false);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [selectedWordDetails] = useState<any>(null);
  const [showWordDetailsModal, setShowWordDetailsModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Fetch memory
  const { data: memory, isLoading, isError, refetch } = useQuery({
    queryKey: ['memory', id],
    queryFn: () => getMemory(id!),
    enabled: !!id,
  });

  // Fetch reminders for this memory
  const { data: reminders, isLoading: loadingReminders } = useQuery({
    queryKey: ['reminders', id],
    queryFn: () => getRemindersForMemory(id!),
    enabled: !!id,
  });

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(updateMemorySchema),
  });

  // Reset form when memory loads
  useEffect(() => {
    if (memory) {
      reset({
        textContent: memory.textContent || '',
        latitude: memory.latitude || undefined,
        longitude: memory.longitude || undefined,
      });
    }
  }, [memory, reset]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => updateMemory(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory', id] });
      queryClient.invalidateQueries({ queryKey: ['recent-memories'] });
      setIsEditing(false);
      setSuccessMessage('Memory updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update memory');
    },
  });

  // Update reminder mutation
  const updateReminderMutation = useMutation({
    mutationFn: ({ reminderId, scheduledAt }: { reminderId: string; scheduledAt: string }) =>
      updateReminderSchedule(reminderId, scheduledAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', id] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-reminders'] });
      setEditingReminderId(null);
      setEditingReminderTime('');
      setSuccessMessage('Reminder updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update reminder');
    },
  });

  // Delete reminder mutation
  const deleteReminderMutation = useMutation({
    mutationFn: (reminderId: string) => deleteReminder(reminderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', id] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-reminders'] });
      setSuccessMessage('Reminder deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to delete reminder');
    },
  });

  // Delete memory mutation
  const deleteMemoryMutation = useMutation({
    mutationFn: () => deleteMemory(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['recent-memories'] });
      navigate('/app/search');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to delete memory');
      setShowDeleteConfirm(false);
    },
  });

  // Create SRS reminders mutation
  const createRemindersMutation = useMutation({
    mutationFn: () => createSRSReminders(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', id] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-reminders'] });
      setSuccessMessage('3 SRS reminders created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to create reminders');
    },
  });

  const onSubmit = (data: any) => {
    setError('');
    updateMutation.mutate({
      textContent: data.textContent,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    });
  };

  // Add caption as word directly
  const handleAddCaptionAsWord = async () => {
    if (!memory?.textContent || memory.textContent.trim().length < 2) {
      setError('Memory text is too short to add as a word (minimum 2 characters)');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const result = await linkWordsToMemory(id!, [memory.textContent.trim()]);
      const totalWords = result.linked.length + result.created.length;

      if (totalWords > 0) {
        queryClient.invalidateQueries({ queryKey: ['memory', id] });
        // Refetch memory to show the linked word immediately
        refetch();
        setSuccessMessage(`Caption added and linked as word!${result.created.length > 0 ? ' (new word created)' : ' (existing word linked)'}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add caption as word');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Analyze memory text for words
  const handleAnalyzeForWords = async () => {
    if (!memory?.textContent || memory.textContent.trim().length < 2) {
      setError('Memory text is too short to analyze for words (minimum 2 characters)');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setAnalyzingWords(true);
    try {
      const result = await analyzeText(memory.textContent);
      setDetectedWords(result.words);

      if (result.words.length === 0) {
        setSuccessMessage('No interesting words found in this memory');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setShowWordModal(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze memory for words');
      setTimeout(() => setError(''), 3000);
    } finally {
      setAnalyzingWords(false);
    }
  };

  // Handle word confirmation - add to selected list
  const handleConfirmWord = async (wordMatch: WordMatch) => {
    console.log('Word confirmed:', wordMatch.word);

    // Add to selected words and remove from detected
    setSelectedWords(prev => [...prev, wordMatch.word]);
    setDetectedWords(prev => prev.filter(w => w.word !== wordMatch.word));
  };

  // Link all detected words to memory when modal closes
  const handleWordModalClose = async () => {
    // Combine both selected words (clicked) and remaining detected words
    const allWords = [...selectedWords, ...detectedWords.map(w => w.word)];

    if (allWords.length > 0) {
      try {
        const result = await linkWordsToMemory(id!, allWords);
        setSuccessMessage(
          `Linked ${result.created.length} new word(s) and ${result.linked.length} existing word(s) to this memory`
        );
        setTimeout(() => setSuccessMessage(''), 3000);

        // Refetch memory to show updated links
        refetch();
      } catch (err: any) {
        console.error('Failed to link words:', err);
        setError(err.message || 'Failed to link words to memory');
        setTimeout(() => setError(''), 3000);
      }
    }

    setShowWordModal(false);
    setDetectedWords([]);
    setSelectedWords([]);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading memory...</div>
        </div>
      </div>
    );
  }

  if (isError || !memory) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Memory not found or you don't have permission to view it.
        </div>
        <button
          onClick={() => navigate('/app/search')}
          className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Memories
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/app/search')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Memories
          </button>
          <button
            onClick={() => navigate('/app/capture')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Add Another Memory
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Memory Details</h1>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {!isEditing && (
              <>
                <button
                  onClick={() => navigate(`/app/memories/${id}/link`)}
                  className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm md:text-base"
                >
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Link</span>
                </button>
                <button
                  onClick={handleAnalyzeForWords}
                  disabled={analyzingWords}
                  className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm md:text-base whitespace-nowrap"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">{analyzingWords ? 'Analyzing...' : 'Find Words'}</span>
                  <span className="sm:hidden">Words</span>
                </button>
                <button
                  onClick={handleAddCaptionAsWord}
                  className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm md:text-base whitespace-nowrap"
                  title="Add caption as word"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden lg:inline">Add Caption as Word</span>
                  <span className="lg:hidden hidden sm:inline">Add Caption</span>
                  <span className="sm:hidden">+Word</span>
                </button>
                <button
                  onClick={() => createRemindersMutation.mutate()}
                  disabled={createRemindersMutation.isPending}
                  className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm md:text-base disabled:opacity-50"
                  title="Create 3 SRS reminders"
                >
                  <Bell className="h-4 w-4" />
                  <span className="hidden lg:inline">Create Reminders</span>
                  <span className="lg:hidden hidden sm:inline">Reminders</span>
                  <span className="sm:hidden">+R</span>
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm md:text-base"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm md:text-base"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </>
            )}
            {isEditing && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  reset();
                  setError('');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Memory Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {!isEditing ? (
          // View Mode
          <div className="space-y-6">
            {/* Text Content */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Content</label>
              <div className="text-gray-900 whitespace-pre-wrap">{memory.textContent}</div>
            </div>

            {/* Location */}
            {memory.latitude && memory.longitude && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Coordinates</label>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {memory.latitude.toFixed(4)}, {memory.longitude.toFixed(4)}
                  </span>
                  {memory.location && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                      📍 {memory.location.name}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created: {new Date(memory.createdAt).toLocaleString()}</span>
                </div>
                {memory.updatedAt !== memory.createdAt && (
                  <div className="flex items-center gap-1">
                    <span>Updated: {new Date(memory.updatedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Edit Mode
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Text Content */}
            <div>
              <label htmlFor="textContent" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                id="textContent"
                {...register('textContent')}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.textContent?.message && (
                <p className="mt-1 text-sm text-red-600">{String(errors.textContent.message)}</p>
              )}
            </div>

            {/* Location (read-only for now) */}
            {memory.latitude && memory.longitude && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coordinates</label>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {memory.latitude.toFixed(4)}, {memory.longitude.toFixed(4)}
                  </span>
                  {memory.location && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                      📍 {memory.location.name}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Word Information Section - Legacy single word display (deprecated) */}
      {/* This section is kept for backwards compatibility but wordLinks should be used instead */}

      {/* Event Information Section */}
      {memory.event && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              <span className="mr-2">🎉</span>
              {memory.event.name}
            </h2>
          </div>

          <div className="space-y-4">
            {/* Description */}
            {memory.event.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Description</h3>
                <p className="text-gray-700">{memory.event.description}</p>
              </div>
            )}

            {/* Event Date and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memory.event.eventDate && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Date</h3>
                  <p className="text-gray-700">
                    {new Date(memory.event.eventDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {memory.event.location && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
                  <p className="text-gray-700">{memory.event.location}</p>
                </div>
              )}
            </div>

            {/* Tags */}
            {memory.event.tags && memory.event.tags.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {memory.event.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Last Enriched */}
            {memory.event.lastEnrichedAt && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(memory.event.lastEnrichedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Information Section */}
      {memory.location && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              <span className="mr-2">📍</span>
              {memory.location.name}
            </h2>
          </div>

          <div className="space-y-4">
            {/* Description */}
            {memory.location.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Description</h3>
                <p className="text-gray-700">{memory.location.description}</p>
              </div>
            )}

            {/* Address */}
            {memory.location.address && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                <p className="text-gray-700">{memory.location.address}</p>
              </div>
            )}

            {/* City, Country, Place Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {memory.location.city && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">City</h3>
                  <p className="text-gray-700">{memory.location.city}</p>
                </div>
              )}

              {memory.location.country && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Country</h3>
                  <p className="text-gray-700">{memory.location.country}</p>
                </div>
              )}

              {memory.location.placeType && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Type</h3>
                  <span className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full">
                    {memory.location.placeType}
                  </span>
                </div>
              )}
            </div>

            {/* Coordinates */}
            {(memory.location.latitude || memory.location.longitude) && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Coordinates</h3>
                <p className="text-gray-700">
                  {memory.location.latitude?.toFixed(4)}, {memory.location.longitude?.toFixed(4)}
                </p>
              </div>
            )}

            {/* Last Enriched */}
            {memory.location.lastEnrichedAt && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(memory.location.lastEnrichedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Person Information Section */}
      {memory.person && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              <span className="mr-2">👤</span>
              {memory.person.displayName}
            </h2>
          </div>

          <div className="space-y-4">
            {/* Email */}
            {memory.person.email && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                <p className="text-gray-700">{memory.person.email}</p>
              </div>
            )}

            {/* Phone */}
            {memory.person.phone && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                <p className="text-gray-700">{memory.person.phone}</p>
              </div>
            )}

            {/* Notes */}
            {memory.person.notes && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Notes</h3>
                <p className="text-gray-700">{memory.person.notes}</p>
              </div>
            )}

            {/* Last Enriched */}
            {memory.person.lastEnrichedAt && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(memory.person.lastEnrichedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* YouTube Video Section */}
      {memory.youtubeVideo && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🎥</span>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{memory.youtubeVideo.title}</h2>
              {memory.youtubeVideo.creatorDisplayName && (
                <p className="text-gray-600 mt-1">{memory.youtubeVideo.creatorDisplayName}</p>
              )}
            </div>
            <button
              onClick={() => navigate(`/app/youtube-videos/${memory.youtubeVideo?.id}`)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              View Video
            </button>
          </div>

          <div className="space-y-4">
            {memory.youtubeVideo.thumbnailUrl && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={memory.youtubeVideo.thumbnailUrl}
                  alt={memory.youtubeVideo.title}
                  className="w-full h-auto"
                />
              </div>
            )}

            {memory.youtubeVideo.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 line-clamp-3">{memory.youtubeVideo.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-200">
              {memory.youtubeVideo.viewCount && (
                <div>
                  <p className="text-xs text-gray-500">Views</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {memory.youtubeVideo.viewCount.toLocaleString()}
                  </p>
                </div>
              )}
              {memory.youtubeVideo.likeCount && (
                <div>
                  <p className="text-xs text-gray-500">Likes</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {memory.youtubeVideo.likeCount.toLocaleString()}
                  </p>
                </div>
              )}
              {memory.youtubeVideo.duration && (
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {memory.youtubeVideo.duration}
                  </p>
                </div>
              )}
              {memory.youtubeVideo.publishedAt && (
                <div>
                  <p className="text-xs text-gray-500">Published</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(memory.youtubeVideo.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TikTok Video Section */}
      {memory.tiktokVideo && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📱</span>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{memory.tiktokVideo.title}</h2>
              {memory.tiktokVideo.creatorDisplayName && (
                <p className="text-gray-600 mt-1">
                  {memory.tiktokVideo.creatorDisplayName}
                  {memory.tiktokVideo.creatorUsername && (
                    <span className="text-gray-400 ml-2">@{memory.tiktokVideo.creatorUsername}</span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={() => navigate(`/app/tiktok-videos/${memory.tiktokVideo?.id}`)}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              View Video
            </button>
          </div>

          <div className="space-y-4">
            {memory.tiktokVideo.thumbnailUrl && (
              <div className="rounded-lg overflow-hidden max-w-sm mx-auto">
                <img
                  src={memory.tiktokVideo.thumbnailUrl}
                  alt={memory.tiktokVideo.title}
                  className="w-full h-auto"
                />
              </div>
            )}

            {memory.tiktokVideo.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{memory.tiktokVideo.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-200">
              {memory.tiktokVideo.viewCount && (
                <div>
                  <p className="text-xs text-gray-500">Views</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {memory.tiktokVideo.viewCount.toLocaleString()}
                  </p>
                </div>
              )}
              {memory.tiktokVideo.likeCount && (
                <div>
                  <p className="text-xs text-gray-500">Likes</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {memory.tiktokVideo.likeCount.toLocaleString()}
                  </p>
                </div>
              )}
              {memory.tiktokVideo.shareCount && (
                <div>
                  <p className="text-xs text-gray-500">Shares</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {memory.tiktokVideo.shareCount.toLocaleString()}
                  </p>
                </div>
              )}
              {memory.tiktokVideo.publishedAt && (
                <div>
                  <p className="text-xs text-gray-500">Published</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(memory.tiktokVideo.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Linked Words Section */}
      {memory.wordLinks && memory.wordLinks.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Vocabulary Words ({memory.wordLinks.length})</h2>
          </div>
          <div className="space-y-4">
            {memory.wordLinks.map((link) => (
              <div key={link.id} className="border border-indigo-200 rounded-lg overflow-hidden">
                {/* Word Header */}
                <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-indigo-900">{link.word.word}</h3>
                      {link.word.phonetic && (
                        <span className="text-sm text-indigo-600 italic">{link.word.phonetic}</span>
                      )}
                      {link.word.partOfSpeech && (
                        <span className="px-2 py-0.5 bg-indigo-200 text-indigo-800 rounded text-xs font-medium">
                          {link.word.partOfSpeech}
                        </span>
                      )}
                    </div>
                    {link.word.difficulty && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        link.word.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        link.word.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {link.word.difficulty}
                      </span>
                    )}
                  </div>
                </div>

                {/* Word Details */}
                <div className="p-4 space-y-3">
                  {/* Definition */}
                  {link.word.description && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Definition</h4>
                      <p className="text-gray-900">{link.word.description}</p>
                    </div>
                  )}

                  {/* Etymology */}
                  {link.word.etymology && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Etymology</h4>
                      <p className="text-gray-700 text-sm">{link.word.etymology}</p>
                    </div>
                  )}

                  {/* Examples */}
                  {link.word.examples && Array.isArray(link.word.examples) && link.word.examples.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Examples</h4>
                      <ul className="space-y-1">
                        {link.word.examples.map((example: string, index: number) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="text-indigo-600 mr-2">•</span>
                            <span className="italic">"{example}"</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Synonyms & Antonyms */}
                  {((link.word.synonyms && link.word.synonyms.length > 0) || (link.word.antonyms && link.word.antonyms.length > 0)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {link.word.synonyms && Array.isArray(link.word.synonyms) && link.word.synonyms.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Synonyms</h4>
                          <div className="flex flex-wrap gap-1">
                            {link.word.synonyms.map((synonym: string, index: number) => (
                              <span key={index} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                {synonym}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {link.word.antonyms && Array.isArray(link.word.antonyms) && link.word.antonyms.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Antonyms</h4>
                          <div className="flex flex-wrap gap-1">
                            {link.word.antonyms.map((antonym: string, index: number) => (
                              <span key={index} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                                {antonym}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked Images Section */}
      {memory.imageLinks && memory.imageLinks.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ImageIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Linked Images ({memory.imageLinks.length})</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {memory.imageLinks.map((link) => (
              <div key={link.id} className="relative group">
                <img
                  src={link.image.thumbnailUrl256 || link.image.storageUrl}
                  alt={`Image from ${new Date(link.image.capturedAt || link.createdAt).toLocaleDateString()}`}
                  className="w-full h-48 object-cover rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedImage(link.image);
                    setShowImageModal(true);
                  }}
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {link.image.capturedAt
                    ? new Date(link.image.capturedAt).toLocaleDateString()
                    : 'No date'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked URLs Section */}
      {memory.urlPageLinks && memory.urlPageLinks.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ExternalLink className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Linked URLs ({memory.urlPageLinks.length})</h2>
          </div>
          <div className="space-y-4">
            {memory.urlPageLinks.map((link) => (
              <div key={link.id} className="border border-purple-200 rounded-lg p-4 hover:bg-purple-50 transition-colors">
                <div className="flex items-start gap-3">
                  {/* Thumbnail or Icon */}
                  {link.urlPage.imageUrl ? (
                    <img
                      src={link.urlPage.imageUrl}
                      alt={link.urlPage.title || 'URL preview'}
                      className="w-24 h-24 object-cover rounded-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-purple-100 rounded-md flex items-center justify-center flex-shrink-0">
                      <ExternalLink className="h-8 w-8 text-purple-600" />
                    </div>
                  )}

                  {/* URL Info */}
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <a
                      href={link.urlPage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-purple-900 hover:text-purple-700 hover:underline line-clamp-2 block mb-1"
                    >
                      {link.urlPage.title || 'Untitled'}
                    </a>

                    {/* Site Name & Author */}
                    {(link.urlPage.siteName || link.urlPage.author) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        {link.urlPage.siteName && <span>{link.urlPage.siteName}</span>}
                        {link.urlPage.siteName && link.urlPage.author && <span>•</span>}
                        {link.urlPage.author && <span>{link.urlPage.author}</span>}
                      </div>
                    )}

                    {/* Description or Summary */}
                    {(link.urlPage.description || link.urlPage.summary) && (
                      <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                        {link.urlPage.description || link.urlPage.summary}
                      </p>
                    )}

                    {/* Tags */}
                    {link.urlPage.tags && link.urlPage.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {link.urlPage.tags.slice(0, 5).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {link.urlPage.tags.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{link.urlPage.tags.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* URL */}
                    <a
                      href={link.urlPage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-600 hover:underline truncate block"
                    >
                      {link.urlPage.url}
                    </a>

                    {/* Metadata */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {link.urlPage.publishedAt && (
                        <span>Published: {new Date(link.urlPage.publishedAt).toLocaleDateString()}</span>
                      )}
                      <span>Fetched: {new Date(link.urlPage.fetchedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions Section */}
      {memory.questions && memory.questions.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Questions ({memory.questions.length})</h2>
          </div>
          <div className="space-y-4">
            {memory.questions.map((question: any) => (
              <div
                key={question.id}
                onClick={() => navigate(`/app/questions/${question.id}`)}
                className="border border-purple-200 rounded-lg p-4 hover:bg-purple-50 cursor-pointer transition-colors"
              >
                {/* Question */}
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Question</h3>
                  <p className="text-gray-900 font-medium">{question.question}</p>
                </div>

                {/* Answer */}
                {question.answer && (
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Answer</h3>
                    <p className="text-gray-700 text-sm line-clamp-3">{question.answer}</p>
                  </div>
                )}

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>Asked: {new Date(question.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Memories Section */}
      {((memory.sourceRelationships?.length ?? 0) > 0 || (memory.relatedFromMemories?.length ?? 0) > 0) && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              <span className="mr-2">🔗</span>
              Related Memories
            </h2>
          </div>

          <div className="space-y-3">
            {/* Source relationships (memories this one links TO) */}
            {memory.sourceRelationships?.map((rel) => (
              <div
                key={rel.id}
                onClick={() => navigate(`/app/memories/${rel.relatedMemory.id}`)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium line-clamp-2">
                      {rel.relatedMemory.textContent || 'Untitled memory'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {rel.relationshipType}
                      </span>
                      {rel.relatedMemory.type && (
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: rel.relatedMemory.type.color + '20',
                            color: rel.relatedMemory.type.color,
                          }}
                        >
                          {rel.relatedMemory.type.icon} {rel.relatedMemory.type.label}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(rel.relatedMemory.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Related from memories (memories that link TO this one) */}
            {memory.relatedFromMemories?.map((rel) => (
              <div
                key={rel.id}
                onClick={() => navigate(`/app/memories/${rel.sourceMemory.id}`)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium line-clamp-2">
                      {rel.sourceMemory.textContent || 'Untitled memory'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {rel.relationshipType}
                      </span>
                      {rel.sourceMemory.type && (
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: rel.sourceMemory.type.color + '20',
                            color: rel.sourceMemory.type.color,
                          }}
                        >
                          {rel.sourceMemory.type.icon} {rel.sourceMemory.type.label}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(rel.sourceMemory.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reminders Section */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Reminders</h2>
          </div>
        </div>

        {loadingReminders ? (
          <p className="text-sm text-gray-600">Loading reminders...</p>
        ) : reminders && reminders.length > 0 ? (
          <div className="space-y-3">
            {reminders.map((reminder: any) => {
              const isEditing = editingReminderId === reminder.id;
              const scheduledDate = new Date(reminder.scheduledAt);
              const isPast = scheduledDate < new Date();

              return (
                <div
                  key={reminder.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isPast ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {isEditing ? (
                    <>
                      <input
                        type="datetime-local"
                        value={editingReminderTime}
                        onChange={(e) => setEditingReminderTime(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <div className="flex items-center gap-2 ml-3">
                        <button
                          onClick={() => {
                            updateReminderMutation.mutate({
                              reminderId: reminder.id,
                              scheduledAt: editingReminderTime,
                            });
                          }}
                          disabled={updateReminderMutation.isPending}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingReminderId(null);
                            setEditingReminderTime('');
                          }}
                          className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className={`text-sm ${isPast ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
                            {scheduledDate.toLocaleString()}
                          </span>
                          {isPast && (
                            <span className="text-xs text-red-600 font-medium">(Overdue)</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Status: {reminder.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingReminderId(reminder.id);
                            // Convert to local datetime-local format
                            const localDateTime = new Date(scheduledDate.getTime() - scheduledDate.getTimezoneOffset() * 60000)
                              .toISOString()
                              .slice(0, 16);
                            setEditingReminderTime(localDateTime);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                          title="Edit time"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this reminder?')) {
                              deleteReminderMutation.mutate(reminder.id);
                            }
                          }}
                          disabled={deleteReminderMutation.isPending}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full disabled:opacity-50"
                          title="Delete reminder"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No reminders for this memory.
            {memory?.type?.code === 'word' && ' Word memories automatically get 3 reminders when created.'}
          </p>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !deleteMemoryMutation.isPending) {
              deleteMemoryMutation.mutate();
            } else if (e.key === 'Escape') {
              setShowDeleteConfirm(false);
            }
          }}
          tabIndex={-1}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Memory?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this memory? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteMemoryMutation.isPending}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMemoryMutation.mutate()}
                disabled={deleteMemoryMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                autoFocus
              >
                {deleteMemoryMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Word Detection Modal */}
      <EntitySuggestionsModal
        isOpen={showWordModal}
        onClose={handleWordModalClose}
        persons={[]}
        locations={[]}
        youtubeVideos={[]}
        words={detectedWords}
        onConfirmPerson={() => {}}
        onConfirmLocation={() => {}}
        onConfirmYouTubeVideo={() => {}}
        onConfirmWord={handleConfirmWord}
        onSkip={() => {
          setSelectedWords([]);
          setDetectedWords([]);
          setShowWordModal(false);
        }}
      />

      {/* Word Details Modal */}
      {showWordDetailsModal && selectedWordDetails && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowWordDetailsModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {selectedWordDetails.word?.word || selectedWordDetails.textContent}
                  </h2>
                  {selectedWordDetails.word?.phonetic && (
                    <p className="text-lg text-gray-500">{selectedWordDetails.word.phonetic}</p>
                  )}
                  {selectedWordDetails.word?.partOfSpeech && (
                    <span className="inline-block mt-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                      {selectedWordDetails.word.partOfSpeech}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowWordDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Description */}
              {selectedWordDetails.word?.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Definition
                  </h3>
                  <p className="text-gray-900">{selectedWordDetails.word.description}</p>
                </div>
              )}

              {/* Etymology */}
              {selectedWordDetails.word?.etymology && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Etymology
                  </h3>
                  <p className="text-gray-700 text-sm">{selectedWordDetails.word.etymology}</p>
                </div>
              )}

              {/* Examples */}
              {selectedWordDetails.word?.examples && Array.isArray(selectedWordDetails.word.examples) && selectedWordDetails.word.examples.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Examples
                  </h3>
                  <ul className="space-y-2">
                    {selectedWordDetails.word.examples.map((example: string, index: number) => (
                      <li key={index} className="text-gray-700 text-sm flex items-start">
                        <span className="text-indigo-600 mr-2">•</span>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Synonyms & Antonyms */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedWordDetails.word?.synonyms && Array.isArray(selectedWordDetails.word.synonyms) && selectedWordDetails.word.synonyms.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                      Synonyms
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedWordDetails.word.synonyms.map((synonym: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm"
                        >
                          {synonym}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedWordDetails.word?.antonyms && Array.isArray(selectedWordDetails.word.antonyms) && selectedWordDetails.word.antonyms.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                      Antonyms
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedWordDetails.word.antonyms.map((antonym: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm"
                        >
                          {antonym}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Difficulty */}
              {selectedWordDetails.word?.difficulty && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Difficulty
                  </h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedWordDetails.word.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    selectedWordDetails.word.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {selectedWordDetails.word.difficulty}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowWordDetailsModal(false)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors z-10"
            >
              <X className="h-6 w-6 text-gray-700" />
            </button>

            {/* Image */}
            <img
              src={selectedImage.storageUrl}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />

            {/* Image info */}
            {selectedImage.capturedAt && (
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg">
                <p className="text-sm">
                  Captured: {new Date(selectedImage.capturedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Help Popup */}
      <HelpPopup
        pageKey="memory-detail"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}