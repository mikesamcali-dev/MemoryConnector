import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllProjects, createProject, deleteProject } from '../api/projects';
import { FolderKanban, Plus, Search, Trash2 } from 'lucide-react';
import { ProjectEditModal } from '../components/ProjectEditModal';

export function ProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: projects,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: getAllProjects,
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const filteredProjects = Array.isArray(projects)
    ? projects.filter((project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  const handleCreateProject = (data: any) => {
    createMutation.mutate(data);
  };

  const handleDeleteProject = (id: string, name: string) => {
    if (
      confirm(
        `Are you sure you want to delete "${name}"? This will unlink all memories from this topic.`,
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading topics...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <p className="text-red-600 text-center">Error loading topics</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Topics</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">New Topic</span>
            </button>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Array.isArray(projects) ? projects.length : 0}
                </p>
                <p className="text-sm text-gray-600">Total Topics</p>
              </div>
              <div className="border-l border-gray-200 pl-4">
                <p className="text-2xl font-bold text-gray-900">
                  {Array.isArray(projects)
                    ? projects.reduce(
                        (sum, p) => sum + (p._count?.memoryLinks || 0),
                        0,
                      )
                    : 0}
                </p>
                <p className="text-sm text-gray-600">Total Memories</p>
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
              placeholder="Search topics..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects && filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div
                  onClick={() => navigate(`/app/projects/${project.id}`)}
                  className="p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FolderKanban className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {project._count?.memoryLinks || 0} memories
                        </p>
                      </div>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                          +{project.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id, project.name);
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
            <FolderKanban className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm
                ? 'No topics found'
                : 'No topics yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'Try a different search term'
                : 'Create your first topic to organize your memories'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Create Topic
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <ProjectEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateProject}
        isSaving={createMutation.isPending}
      />
    </div>
  );
}
