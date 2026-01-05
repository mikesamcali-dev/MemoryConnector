import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProjectById,
  updateProject,
  deleteProject,
  unlinkMemoryFromProject,
} from '../api/projects';
import {
  ArrowLeft,
  FolderKanban,
  Edit,
  Trash2,
  ExternalLink,
  Tag,
  Link as LinkIcon,
  Plus,
} from 'lucide-react';
import { ProjectEditModal } from '../components/ProjectEditModal';
import { ProjectLinkMemoryModal } from '../components/ProjectLinkMemoryModal';
import { AddMemoryToProjectModal } from '../components/AddMemoryToProjectModal';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isAddMemoryModalOpen, setIsAddMemoryModalOpen] = useState(false);

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateProject(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsEditModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/app/projects');
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (memoryId: string) => unlinkMemoryFromProject(id!, memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete "${project?.name}"? This will unlink all memories from this project.`,
      )
    ) {
      deleteMutation.mutate();
    }
  };

  const handleUnlink = (memoryId: string) => {
    if (confirm('Are you sure you want to unlink this memory from the project?')) {
      unlinkMutation.mutate(memoryId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <p className="text-red-600 text-center mb-4">Project not found</p>
          <button
            onClick={() => navigate('/app/projects')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/app/projects')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </button>
        </div>

        {/* Project Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
                <p className="text-blue-100">
                  {project.memoryLinks?.length || 0} memories linked
                </p>
              </div>
              <FolderKanban className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Description */}
            {project.description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {project.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-blue-600" />
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Memories */}
            {project.memoryLinks && project.memoryLinks.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-blue-600" />
                  Linked Memories ({project.memoryLinks.length})
                </h2>
                <div className="space-y-2">
                  {project.memoryLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg group"
                    >
                      <button
                        onClick={() => navigate(`/app/memories/${link.memory.id}`)}
                        className="flex-1 text-left"
                      >
                        <p className="text-gray-900 line-clamp-2">
                          {link.memory.body}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(link.memory.createdAt).toLocaleDateString()}
                        </p>
                      </button>
                      <button
                        onClick={() => handleUnlink(link.memory.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Unlink memory"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Memories */}
            {(!project.memoryLinks || project.memoryLinks.length === 0) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-600 mb-4">
                  No memories linked to this project yet
                </p>
                <p className="text-sm text-gray-500">
                  Use the buttons below to add or link memories to this project.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-3">
              <button
                onClick={() => setIsAddMemoryModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                <Plus className="h-4 w-4" />
                Add a Memory
              </button>
              <button
                onClick={() => setIsLinkModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <LinkIcon className="h-4 w-4" />
                Link Memory
              </button>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <Edit className="h-4 w-4" />
                Edit Project
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Project
              </button>
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
              <p>Created: {new Date(project.createdAt).toLocaleString()}</p>
              <p>Updated: {new Date(project.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <ProjectEditModal
        project={project}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(data) => updateMutation.mutate(data)}
        isSaving={updateMutation.isPending}
      />

      {/* Link Memory Modal */}
      <ProjectLinkMemoryModal
        projectId={id!}
        projectName={project.name}
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        linkedMemoryIds={project.memoryLinks?.map((link) => link.memory.id) || []}
      />

      {/* Add Memory Modal */}
      <AddMemoryToProjectModal
        projectId={id!}
        projectName={project.name}
        isOpen={isAddMemoryModalOpen}
        onClose={() => setIsAddMemoryModalOpen(false)}
      />
    </div>
  );
}
