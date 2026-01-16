import { useState } from 'react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useNavigate } from 'react-router-dom';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { getAllTrainings, createTraining, deleteTraining } from '../api/trainings';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { GraduationCap, Plus, Search, Trash2 } from 'lucide-react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { TrainingEditModal } from '../components/TrainingEditModal';

import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
export function TrainingsPage() {
    const helpPopup = useHelpPopup('trainings');
const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: trainings,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['trainings'],
    queryFn: getAllTrainings,
  });

  const createMutation = useMutation({
    mutationFn: createTraining,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTraining,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
    },
  });

  const filteredTrainings = Array.isArray(trainings)
    ? trainings.filter((training) =>
        training.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  const handleCreateTraining = (data: any) => {
    createMutation.mutate(data);
  };

  const handleDeleteTraining = (id: string, name: string) => {
    if (
      confirm(
        `Are you sure you want to delete "${name}"? This will unlink all content from this training.`,
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trainings...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <p className="text-red-600 text-center">Error loading trainings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Trainings</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">New Training</span>
            </button>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Array.isArray(trainings) ? trainings.length : 0}
                </p>
                <p className="text-sm text-gray-600">Total Trainings</p>
              </div>
              <div className="border-l border-gray-200 pl-4">
                <p className="text-2xl font-bold text-gray-900">
                  {Array.isArray(trainings)
                    ? trainings.reduce(
                        (sum, t) => sum + (t._count?.memoryLinks || 0),
                        0,
                      )
                    : 0}
                </p>
                <p className="text-sm text-gray-600">Total Memories</p>
              </div>
              <div className="border-l border-gray-200 pl-4">
                <p className="text-2xl font-bold text-gray-900">
                  {Array.isArray(trainings)
                    ? trainings.reduce(
                        (sum, t) =>
                          sum +
                          (t._count?.memoryLinks || 0) +
                          (t._count?.imageLinks || 0) +
                          (t._count?.youtubeVideoLinks || 0) +
                          (t._count?.tiktokVideoLinks || 0) +
                          (t._count?.urlPageLinks || 0),
                        0,
                      )
                    : 0}
                </p>
                <p className="text-sm text-gray-600">Total Content Items</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search trainings..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Trainings Grid */}
        {filteredTrainings && filteredTrainings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrainings.map((training) => (
              <div
                key={training.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div
                  onClick={() => navigate(`/app/trainings/${training.id}`)}
                  className="p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <GraduationCap className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {training.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {(training._count?.memoryLinks || 0) +
                            (training._count?.imageLinks || 0) +
                            (training._count?.youtubeVideoLinks || 0) +
                            (training._count?.tiktokVideoLinks || 0) +
                            (training._count?.urlPageLinks || 0)}{' '}
                          items
                        </p>
                      </div>
                    </div>
                  </div>

                  {training.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {training.description}
                    </p>
                  )}

                  {training.tags && training.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {training.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {training.tags.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                          +{training.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Created {new Date(training.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTraining(training.id, training.name);
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm
                ? 'No trainings found'
                : 'No trainings yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'Try a different search term'
                : 'Create your first training to organize your learning content'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Create Training
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <TrainingEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateTraining}
        isSaving={createMutation.isPending}
      />
      {/* Help Popup */}
      <HelpPopup
        pageKey="trainings"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}