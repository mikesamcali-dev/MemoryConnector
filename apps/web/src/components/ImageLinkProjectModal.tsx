import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, FolderKanban, Loader, Check } from 'lucide-react';
import { getAllProjects } from '../api/projects';
import { createMemory } from '../api/memories';
import { linkMemoryToProject } from '../api/projects';

interface ImageLinkProjectModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLinkProjectModal({
  imageUrl,
  isOpen,
  onClose,
}: ImageLinkProjectModalProps) {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getAllProjects,
    enabled: isOpen,
  });

  const linkMutation = useMutation({
    mutationFn: async (projectId: string) => {
      // Generate idempotency key
      const idempotencyKey = crypto.randomUUID();

      // Create a memory with the image URL
      const memory = await createMemory({
        imageUrl,
        idempotencyKey,
      });

      // Link the memory to the project
      await linkMemoryToProject(projectId, memory.id);

      return memory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['user-images'] });
      setSelectedProjectId(null);
      onClose();
    },
  });

  const handleLink = (projectId: string) => {
    setSelectedProjectId(projectId);
    linkMutation.mutate(projectId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FolderKanban className="h-6 w-6 text-blue-600" />
              Link Image to Project
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Select a project to create a memory and link this image
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={linkMutation.isPending}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Image Preview */}
        <div className="p-6 border-b border-gray-200">
          <img
            src={imageUrl}
            alt="Preview"
            className="max-h-48 max-w-full object-contain rounded-lg border border-gray-200 mx-auto"
          />
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Loading projects...</p>
            </div>
          )}

          {!isLoading && (!projects || projects.length === 0) && (
            <div className="text-center py-12">
              <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No projects found</p>
              <p className="text-sm text-gray-500 mt-2">Create a project first to link images</p>
            </div>
          )}

          {!isLoading && projects && projects.length > 0 && (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {project._count?.memoryLinks || 0} memories
                      </p>
                    </div>

                    <button
                      onClick={() => handleLink(project.id)}
                      disabled={linkMutation.isPending}
                      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                        selectedProjectId === project.id && linkMutation.isPending
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                      }`}
                    >
                      {selectedProjectId === project.id && linkMutation.isPending ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          Linking...
                        </>
                      ) : selectedProjectId === project.id ? (
                        <>
                          <Check className="h-4 w-4" />
                          Linked!
                        </>
                      ) : (
                        'Link'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            disabled={linkMutation.isPending}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
