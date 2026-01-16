import { useState } from 'react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTrainingById,
  updateTraining,
  deleteTraining,
  unlinkMemoryFromTraining,
  unlinkImageFromTraining,
  unlinkUrlPageFromTraining,
  unlinkYouTubeVideoFromTraining,
  unlinkTikTokVideoFromTraining,
} from '../api/trainings';
import { createTrainingDeck } from '../api/training-decks';
import {
  ArrowLeft,
  GraduationCap,
  Edit,
  Trash2,
  ExternalLink,
  Tag,
  Presentation,
  X,
} from 'lucide-react';
import { TrainingEditModal } from '../components/TrainingEditModal';

type TabType = 'memories' | 'images' | 'urls' | 'youtube' | 'tiktok';

export function TrainingDetailPage() {
    const helpPopup = useHelpPopup('training-detail');
const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('memories');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [creatingDeck, setCreatingDeck] = useState(false);

  const { data: training, isLoading, isError } = useQuery({
    queryKey: ['training', id],
    queryFn: () => getTrainingById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateTraining(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training', id] });
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      setIsEditModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTraining(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      navigate('/app/trainings');
    },
  });

  const unlinkMemoryMutation = useMutation({
    mutationFn: (memoryId: string) => unlinkMemoryFromTraining(id!, memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training', id] });
    },
  });

  const unlinkImageMutation = useMutation({
    mutationFn: (imageId: string) => unlinkImageFromTraining(id!, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training', id] });
    },
  });

  const unlinkUrlPageMutation = useMutation({
    mutationFn: (urlPageId: string) => unlinkUrlPageFromTraining(id!, urlPageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training', id] });
    },
  });

  const unlinkYouTubeVideoMutation = useMutation({
    mutationFn: (youtubeVideoId: string) => unlinkYouTubeVideoFromTraining(id!, youtubeVideoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training', id] });
    },
  });

  const unlinkTikTokVideoMutation = useMutation({
    mutationFn: (tiktokVideoId: string) => unlinkTikTokVideoFromTraining(id!, tiktokVideoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training', id] });
    },
  });

  const handleCreateDeck = async () => {
    if (!training) return;
    setCreatingDeck(true);
    try {
      const deck = await createTrainingDeck({
        trainingId: training.id,
        title: `${training.name} - Deck`,
      });
      queryClient.invalidateQueries({ queryKey: ['training-decks'] });
      navigate(`/app/training-decks/${deck.id}/view`);
    } catch (error) {
      console.error('Failed to create training deck:', error);
      alert('Failed to create training deck. Please try again.');
    } finally {
      setCreatingDeck(false);
    }
  };

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete "${training?.name}"? This will unlink all content from this training.`,
      )
    ) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading training...</p>
        </div>
      </div>
    );
  }

  if (isError || !training) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <p className="text-red-600 text-center mb-4">Training not found</p>
          <button
            onClick={() => navigate('/app/trainings')}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Back to Trainings
          </button>
        </div>
      </div>
    );
  }

  const totalContent =
    (training.memoryLinks?.length || 0) +
    (training.imageLinks?.length || 0) +
    (training.urlPageLinks?.length || 0) +
    (training.youtubeVideoLinks?.length || 0) +
    (training.tiktokVideoLinks?.length || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/app/trainings')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Trainings
          </button>
        </div>

        {/* Training Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold mb-2 break-words">{training.name}</h1>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-purple-100 text-xs sm:text-sm">
                  <span>{training.memoryLinks?.length || 0} memories</span>
                  <span>{training.imageLinks?.length || 0} images</span>
                  <span>{training.urlPageLinks?.length || 0} URLs</span>
                  <span>{training.youtubeVideoLinks?.length || 0} YT</span>
                  <span>{training.tiktokVideoLinks?.length || 0} TikTok</span>
                </div>
              </div>
              <GraduationCap className="h-8 w-8 sm:h-12 sm:w-12 text-purple-200 flex-shrink-0" />
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Description */}
            {training.description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Description
                </h2>
                <p className="text-gray-700">{training.description}</p>
              </div>
            )}

            {/* Tags */}
            {training.tags && training.tags.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {training.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Create Training Deck Button */}
            {totalContent > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Ready to train?
                    </h3>
                    <p className="text-sm text-gray-600">
                      Create a training deck to go through all {totalContent} items sequentially
                    </p>
                  </div>
                  <button
                    onClick={handleCreateDeck}
                    disabled={creatingDeck}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    <Presentation className="h-5 w-5" />
                    {creatingDeck ? 'Creating...' : 'Create Deck'}
                  </button>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div>
              <div className="border-b border-gray-200 mb-4">
                <div className="flex gap-2 sm:gap-4 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('memories')}
                    className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                      activeTab === 'memories'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Memories ({training.memoryLinks?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('images')}
                    className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                      activeTab === 'images'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Images ({training.imageLinks?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('urls')}
                    className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                      activeTab === 'urls'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    URLs ({training.urlPageLinks?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('youtube')}
                    className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                      activeTab === 'youtube'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    YouTube ({training.youtubeVideoLinks?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('tiktok')}
                    className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                      activeTab === 'tiktok'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    TikTok ({training.tiktokVideoLinks?.length || 0})
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="space-y-3">
                {/* Memories Tab */}
                {activeTab === 'memories' && (
                  <>
                    {training.memoryLinks && training.memoryLinks.length > 0 ? (
                      training.memoryLinks.map((link) => (
                        <div
                          key={link.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 break-words">
                              {link.memory.body}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(link.memory.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => unlinkMemoryMutation.mutate(link.memory.id)}
                            className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Unlink memory"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No memories linked</p>
                    )}
                  </>
                )}

                {/* Images Tab */}
                {activeTab === 'images' && (
                  <>
                    {training.imageLinks && training.imageLinks.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {training.imageLinks.map((link) => (
                          <div
                            key={link.id}
                            className="relative group bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
                          >
                            <img
                              src={link.image.thumbnailUrl256 || link.image.storageUrl}
                              alt="Linked image"
                              className="w-full aspect-square object-cover"
                            />
                            <button
                              onClick={() => unlinkImageMutation.mutate(link.image.id)}
                              className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Unlink image"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No images linked</p>
                    )}
                  </>
                )}

                {/* URLs Tab */}
                {activeTab === 'urls' && (
                  <>
                    {training.urlPageLinks && training.urlPageLinks.length > 0 ? (
                      training.urlPageLinks.map((link) => (
                        <div
                          key={link.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 mb-1">
                              {link.urlPage.title || 'Untitled'}
                            </h3>
                            <a
                              href={link.urlPage.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-purple-600 hover:underline flex items-center gap-1 break-all"
                            >
                              {link.urlPage.url}
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </a>
                          </div>
                          <button
                            onClick={() => unlinkUrlPageMutation.mutate(link.urlPage.id)}
                            className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Unlink URL"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No URLs linked</p>
                    )}
                  </>
                )}

                {/* YouTube Tab */}
                {activeTab === 'youtube' && (
                  <>
                    {training.youtubeVideoLinks && training.youtubeVideoLinks.length > 0 ? (
                      training.youtubeVideoLinks.map((link) => (
                        <div
                          key={link.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 mb-1">
                              {link.youtubeVideo.title || 'Untitled'}
                            </h3>
                            <p className="text-sm text-gray-600">{link.youtubeVideo.channelTitle}</p>
                            <a
                              href={`https://youtube.com/watch?v=${link.youtubeVideo.videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-purple-600 hover:underline flex items-center gap-1 mt-1"
                            >
                              Watch on YouTube
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </a>
                          </div>
                          <button
                            onClick={() => unlinkYouTubeVideoMutation.mutate(link.youtubeVideo.id)}
                            className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Unlink video"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No YouTube videos linked</p>
                    )}
                  </>
                )}

                {/* TikTok Tab */}
                {activeTab === 'tiktok' && (
                  <>
                    {training.tiktokVideoLinks && training.tiktokVideoLinks.length > 0 ? (
                      training.tiktokVideoLinks.map((link) => (
                        <div
                          key={link.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 mb-1">
                              {link.tiktokVideo.title || 'Untitled'}
                            </h3>
                            <p className="text-sm text-gray-600">{link.tiktokVideo.creator}</p>
                            <a
                              href={link.tiktokVideo.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-purple-600 hover:underline flex items-center gap-1 mt-1"
                            >
                              Watch on TikTok
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </a>
                          </div>
                          <button
                            onClick={() => unlinkTikTokVideoMutation.mutate(link.tiktokVideo.id)}
                            className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Unlink video"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No TikTok videos linked</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit Training
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Training
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <TrainingEditModal
        training={training}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(data) => updateMutation.mutate(data)}
        isSaving={updateMutation.isPending}
      />
      {/* Help Popup */}
      <HelpPopup
        pageKey="training-detail"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}