import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProjectById,
  updateProject,
  deleteProject,
  unlinkMemoryFromProject,
  unlinkImageFromProject,
  unlinkUrlPageFromProject,
  unlinkYouTubeVideoFromProject,
  unlinkTikTokVideoFromProject,
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
  Image as ImageIcon,
  Link2,
  Video,
  Film,
} from 'lucide-react';
import { ProjectEditModal } from '../components/ProjectEditModal';
import { ProjectLinkMemoryModal } from '../components/ProjectLinkMemoryModal';
import { AddMemoryToProjectModal } from '../components/AddMemoryToProjectModal';
import { ProjectLinkImageModal } from '../components/ProjectLinkImageModal';
import { ProjectLinkUrlPageModal } from '../components/ProjectLinkUrlPageModal';
import { ProjectLinkYouTubeVideoModal } from '../components/ProjectLinkYouTubeVideoModal';
import { ProjectLinkTikTokVideoModal } from '../components/ProjectLinkTikTokVideoModal';
import { AddImageToProjectModal } from '../components/AddImageToProjectModal';
import { AddUrlToProjectModal } from '../components/AddUrlToProjectModal';
import { AddYouTubeToProjectModal } from '../components/AddYouTubeToProjectModal';
import { AddTikTokToProjectModal } from '../components/AddTikTokToProjectModal';

type TabType = 'memories' | 'images' | 'urls' | 'youtube' | 'tiktok';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('memories');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isAddMemoryModalOpen, setIsAddMemoryModalOpen] = useState(false);
  const [isLinkImageModalOpen, setIsLinkImageModalOpen] = useState(false);
  const [isLinkUrlPageModalOpen, setIsLinkUrlPageModalOpen] = useState(false);
  const [isLinkYouTubeVideoModalOpen, setIsLinkYouTubeVideoModalOpen] = useState(false);
  const [isLinkTikTokVideoModalOpen, setIsLinkTikTokVideoModalOpen] = useState(false);
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [isAddUrlModalOpen, setIsAddUrlModalOpen] = useState(false);
  const [isAddYouTubeModalOpen, setIsAddYouTubeModalOpen] = useState(false);
  const [isAddTikTokModalOpen, setIsAddTikTokModalOpen] = useState(false);

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

  const unlinkImageMutation = useMutation({
    mutationFn: (imageId: string) => unlinkImageFromProject(id!, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  const unlinkUrlPageMutation = useMutation({
    mutationFn: (urlPageId: string) => unlinkUrlPageFromProject(id!, urlPageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  const unlinkYouTubeVideoMutation = useMutation({
    mutationFn: (youtubeVideoId: string) => unlinkYouTubeVideoFromProject(id!, youtubeVideoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  const unlinkTikTokVideoMutation = useMutation({
    mutationFn: (tiktokVideoId: string) => unlinkTikTokVideoFromProject(id!, tiktokVideoId),
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
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold mb-2 break-words">{project.name}</h1>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-blue-100 text-xs sm:text-sm">
                  <span>{project._count?.memoryLinks || 0} memories</span>
                  <span>{project._count?.imageLinks || 0} images</span>
                  <span>{project._count?.urlPageLinks || 0} URLs</span>
                  <span>{project._count?.youtubeVideoLinks || 0} YT</span>
                  <span>{project._count?.tiktokVideoLinks || 0} TikTok</span>
                </div>
              </div>
              <FolderKanban className="h-8 w-8 sm:h-12 sm:w-12 text-blue-200 flex-shrink-0" />
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 -mx-6 px-6 sm:mx-0 sm:px-0">
              <nav className="flex gap-1 overflow-x-auto scrollbar-hide" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('memories')}
                  className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'memories'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Memories</span>
                    <span className="sm:hidden">Mem</span>
                    <span className="text-xs">({project._count?.memoryLinks || 0})</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('images')}
                  className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'images'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Images</span>
                    <span className="sm:hidden">Img</span>
                    <span className="text-xs">({project._count?.imageLinks || 0})</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('urls')}
                  className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'urls'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <Link2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>URLs</span>
                    <span className="text-xs">({project._count?.urlPageLinks || 0})</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('youtube')}
                  className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'youtube'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <Video className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">YouTube</span>
                    <span className="sm:hidden">YT</span>
                    <span className="text-xs">({project._count?.youtubeVideoLinks || 0})</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('tiktok')}
                  className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'tiktok'
                      ? 'border-pink-600 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <Film className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">TikTok</span>
                    <span className="sm:hidden">TT</span>
                    <span className="text-xs">({project._count?.tiktokVideoLinks || 0})</span>
                  </span>
                </button>
              </nav>
            </div>

            {/* Tab Content - Memories */}
            {activeTab === 'memories' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Linked Memories</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setIsAddMemoryModalOpen(true)}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm font-medium"
                    >
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => setIsLinkModalOpen(true)}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-medium"
                    >
                      <LinkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Link</span>
                    </button>
                  </div>
                </div>

                {project.memoryLinks && project.memoryLinks.length > 0 ? (
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
                          <p className="text-gray-900 line-clamp-2">{link.memory.body}</p>
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
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <p className="text-gray-600">No memories linked yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content - Images */}
            {activeTab === 'images' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Linked Images</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setIsAddImageModalOpen(true)}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm font-medium"
                    >
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => setIsLinkImageModalOpen(true)}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs sm:text-sm font-medium"
                    >
                      <LinkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Link</span>
                    </button>
                  </div>
                </div>

                {project.imageLinks && project.imageLinks.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {project.imageLinks.map((link) => (
                      <div key={link.id} className="group relative rounded-lg overflow-hidden border border-gray-200">
                        <div className="aspect-square relative">
                          <img
                            src={link.image.thumbnailUrl256 || link.image.storageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => unlinkImageMutation.mutate(link.image.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all"
                            title="Unlink image"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <p className="text-gray-600">No images linked yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content - URLs */}
            {activeTab === 'urls' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Linked URLs</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setIsAddUrlModalOpen(true)}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm font-medium"
                    >
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => setIsLinkUrlPageModalOpen(true)}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-medium"
                    >
                      <LinkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Link</span>
                    </button>
                  </div>
                </div>

                {project.urlPageLinks && project.urlPageLinks.length > 0 ? (
                  <div className="space-y-2">
                    {project.urlPageLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg group"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 line-clamp-1">
                            {link.urlPage.title || 'Untitled'}
                          </h4>
                          <a
                            href={link.urlPage.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                          >
                            <span className="truncate">{link.urlPage.url}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                          {link.urlPage.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                              {link.urlPage.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => unlinkUrlPageMutation.mutate(link.urlPage.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Unlink URL"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <p className="text-gray-600">No URLs linked yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content - YouTube */}
            {activeTab === 'youtube' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Linked YouTube Videos</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setIsAddYouTubeModalOpen(true)}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm font-medium"
                    >
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => setIsLinkYouTubeVideoModalOpen(true)}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs sm:text-sm font-medium"
                    >
                      <LinkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Link</span>
                    </button>
                  </div>
                </div>

                {project.youtubeVideoLinks && project.youtubeVideoLinks.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.youtubeVideoLinks.map((link) => (
                      <div key={link.id} className="group rounded-lg overflow-hidden border border-gray-200">
                        <div className="aspect-video relative bg-gray-900">
                          <img
                            src={link.youtubeVideo.thumbnailUrl || `https://img.youtube.com/vi/${link.youtubeVideo.videoId}/mqdefault.jpg`}
                            alt={link.youtubeVideo.title || 'YouTube video'}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => unlinkYouTubeVideoMutation.mutate(link.youtubeVideo.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all"
                            title="Unlink video"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="p-3 bg-white">
                          <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">
                            {link.youtubeVideo.title || 'Untitled video'}
                          </h4>
                          {link.youtubeVideo.channelTitle && (
                            <p className="text-xs text-gray-600 mt-1">{link.youtubeVideo.channelTitle}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <p className="text-gray-600">No YouTube videos linked yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content - TikTok */}
            {activeTab === 'tiktok' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Linked TikTok Videos</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setIsAddTikTokModalOpen(true)}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm font-medium"
                    >
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => setIsLinkTikTokVideoModalOpen(true)}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-xs sm:text-sm font-medium"
                    >
                      <LinkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Link</span>
                    </button>
                  </div>
                </div>

                {project.tiktokVideoLinks && project.tiktokVideoLinks.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {project.tiktokVideoLinks.map((link) => (
                      <div key={link.id} className="group rounded-lg overflow-hidden border border-gray-200">
                        <div className="aspect-[9/16] relative bg-gray-900">
                          {link.tiktokVideo.thumbnailUrl ? (
                            <img
                              src={link.tiktokVideo.thumbnailUrl}
                              alt={link.tiktokVideo.title || 'TikTok video'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="h-12 w-12 text-gray-600" />
                            </div>
                          )}
                          <button
                            onClick={() => unlinkTikTokVideoMutation.mutate(link.tiktokVideo.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all"
                            title="Unlink video"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="p-3 bg-white">
                          <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">
                            {link.tiktokVideo.title || 'Untitled video'}
                          </h4>
                          {link.tiktokVideo.creator && (
                            <p className="text-xs text-gray-600 mt-1">@{link.tiktokVideo.creator}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <p className="text-gray-600">No TikTok videos linked yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-3">
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

      {/* Link Image Modal */}
      <ProjectLinkImageModal
        projectId={id!}
        projectName={project.name}
        isOpen={isLinkImageModalOpen}
        onClose={() => setIsLinkImageModalOpen(false)}
        linkedImageIds={project.imageLinks?.map((link) => link.image.id) || []}
      />

      {/* Link URL Page Modal */}
      <ProjectLinkUrlPageModal
        projectId={id!}
        projectName={project.name}
        isOpen={isLinkUrlPageModalOpen}
        onClose={() => setIsLinkUrlPageModalOpen(false)}
        linkedUrlPageIds={project.urlPageLinks?.map((link) => link.urlPage.id) || []}
      />

      {/* Link YouTube Video Modal */}
      <ProjectLinkYouTubeVideoModal
        projectId={id!}
        projectName={project.name}
        isOpen={isLinkYouTubeVideoModalOpen}
        onClose={() => setIsLinkYouTubeVideoModalOpen(false)}
        linkedYouTubeVideoIds={project.youtubeVideoLinks?.map((link) => link.youtubeVideo.id) || []}
      />

      {/* Link TikTok Video Modal */}
      <ProjectLinkTikTokVideoModal
        projectId={id!}
        projectName={project.name}
        isOpen={isLinkTikTokVideoModalOpen}
        onClose={() => setIsLinkTikTokVideoModalOpen(false)}
        linkedTikTokVideoIds={project.tiktokVideoLinks?.map((link) => link.tiktokVideo.id) || []}
      />

      {/* Add Image Modal */}
      <AddImageToProjectModal
        projectId={id!}
        projectName={project.name}
        isOpen={isAddImageModalOpen}
        onClose={() => setIsAddImageModalOpen(false)}
      />

      {/* Add URL Modal */}
      <AddUrlToProjectModal
        projectId={id!}
        projectName={project.name}
        isOpen={isAddUrlModalOpen}
        onClose={() => setIsAddUrlModalOpen(false)}
      />

      {/* Add YouTube Video Modal */}
      <AddYouTubeToProjectModal
        projectId={id!}
        projectName={project.name}
        isOpen={isAddYouTubeModalOpen}
        onClose={() => setIsAddYouTubeModalOpen(false)}
      />

      {/* Add TikTok Video Modal */}
      <AddTikTokToProjectModal
        projectId={id!}
        projectName={project.name}
        isOpen={isAddTikTokModalOpen}
        onClose={() => setIsAddTikTokModalOpen(false)}
      />
    </div>
  );
}
