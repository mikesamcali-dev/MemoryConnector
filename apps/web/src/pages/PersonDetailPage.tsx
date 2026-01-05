import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPersonById,
  deletePerson,
  unlinkMemoryFromPerson,
  unlinkImageFromPerson,
  unlinkUrlPageFromPerson,
  unlinkYouTubeVideoFromPerson,
  unlinkTikTokVideoFromPerson,
  getPersonRelationships,
  deletePersonRelationship,
} from '../api/people';
import {
  ArrowLeft,
  User,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  Plus,
  Image as ImageIcon,
  Link2,
  Video,
  Film,
  Users,
} from 'lucide-react';
import { PersonLinkMemoryModal } from '../components/PersonLinkMemoryModal';
import { PersonLinkImageModal } from '../components/PersonLinkImageModal';
import { PersonLinkUrlPageModal } from '../components/PersonLinkUrlPageModal';
import { PersonLinkYouTubeVideoModal } from '../components/PersonLinkYouTubeVideoModal';
import { PersonLinkTikTokVideoModal } from '../components/PersonLinkTikTokVideoModal';
import { PersonLinkPersonModal } from '../components/PersonLinkPersonModal';

type TabType = 'memories' | 'images' | 'urls' | 'youtube' | 'tiktok' | 'relationships';

export function PersonDetailPage() {
  const { personId } = useParams<{ personId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('memories');

  // Modal states
  const [isLinkMemoryModalOpen, setIsLinkMemoryModalOpen] = useState(false);
  const [isLinkImageModalOpen, setIsLinkImageModalOpen] = useState(false);
  const [isLinkUrlPageModalOpen, setIsLinkUrlPageModalOpen] = useState(false);
  const [isLinkYouTubeVideoModalOpen, setIsLinkYouTubeVideoModalOpen] = useState(false);
  const [isLinkTikTokVideoModalOpen, setIsLinkTikTokVideoModalOpen] = useState(false);
  const [isLinkPersonModalOpen, setIsLinkPersonModalOpen] = useState(false);

  const { data: person, isLoading, isError } = useQuery({
    queryKey: ['person', personId],
    queryFn: () => getPersonById(personId!),
    enabled: !!personId,
  });

  // Fetch relationships
  const { data: relationships } = useQuery({
    queryKey: ['person-relationships', personId],
    queryFn: () => getPersonRelationships(personId!),
    enabled: !!personId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePerson(personId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      navigate('/app/people');
    },
  });

  const unlinkMemoryMutation = useMutation({
    mutationFn: (memoryId: string) => unlinkMemoryFromPerson(personId!, memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person', personId] });
    },
  });

  const unlinkImageMutation = useMutation({
    mutationFn: (imageId: string) => unlinkImageFromPerson(personId!, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person', personId] });
    },
  });

  const unlinkUrlPageMutation = useMutation({
    mutationFn: (urlPageId: string) => unlinkUrlPageFromPerson(personId!, urlPageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person', personId] });
    },
  });

  const unlinkYouTubeVideoMutation = useMutation({
    mutationFn: (youtubeVideoId: string) => unlinkYouTubeVideoFromPerson(personId!, youtubeVideoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person', personId] });
    },
  });

  const unlinkTikTokVideoMutation = useMutation({
    mutationFn: (tiktokVideoId: string) => unlinkTikTokVideoFromPerson(personId!, tiktokVideoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person', personId] });
    },
  });

  const deleteRelationshipMutation = useMutation({
    mutationFn: (relationshipId: string) => deletePersonRelationship(relationshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person', personId] });
      queryClient.invalidateQueries({ queryKey: ['person-relationships', personId] });
    },
  });

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete "${person?.displayName}"? This will unlink all content from this person.`,
      )
    ) {
      deleteMutation.mutate();
    }
  };

  const handleUnlinkMemory = (memoryId: string) => {
    if (confirm('Are you sure you want to unlink this memory from the person?')) {
      unlinkMemoryMutation.mutate(memoryId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading person...</p>
        </div>
      </div>
    );
  }

  if (isError || !person) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <p className="text-red-600 text-center mb-4">Person not found</p>
          <button
            onClick={() => navigate('/app/people')}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to People
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
            onClick={() => navigate('/app/people')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to People
          </button>
        </div>

        {/* Person Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold mb-2 break-words">
                  {person.displayName}
                </h1>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-indigo-100 text-xs sm:text-sm">
                  <span>{person._count?.memoryLinks || 0} memories</span>
                  <span>{person._count?.imageLinks || 0} images</span>
                  <span>{person._count?.urlPageLinks || 0} URLs</span>
                  <span>{person._count?.youtubeVideoLinks || 0} YT</span>
                  <span>{person._count?.tiktokVideoLinks || 0} TikTok</span>
                </div>
              </div>
              <User className="h-8 w-8 sm:h-12 sm:w-12 text-indigo-200 flex-shrink-0" />
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Contact Info */}
            <div className="space-y-2">
              {person.email && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${person.email}`} className="hover:text-indigo-600">
                    {person.email}
                  </a>
                </div>
              )}
              {person.phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${person.phone}`} className="hover:text-indigo-600">
                    {person.phone}
                  </a>
                </div>
              )}
            </div>

            {/* Bio */}
            {person.bio && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Bio</h2>
                <p className="text-gray-700 leading-relaxed">{person.bio}</p>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 -mx-6 px-6 sm:mx-0 sm:px-0">
              <nav className="flex gap-1 overflow-x-auto scrollbar-hide" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('memories')}
                  className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'memories'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Memories</span>
                    <span className="sm:hidden">Mem</span>
                    <span className="text-xs">({person._count?.memoryLinks || 0})</span>
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
                    <span className="text-xs">({person._count?.imageLinks || 0})</span>
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
                    <span className="text-xs">({person._count?.urlPageLinks || 0})</span>
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
                    <span className="text-xs">({person._count?.youtubeVideoLinks || 0})</span>
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
                    <span className="text-xs">({person._count?.tiktokVideoLinks || 0})</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('relationships')}
                  className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'relationships'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Relationships</span>
                    <span className="sm:hidden">Rel</span>
                    <span className="text-xs">({relationships?.length || 0})</span>
                  </span>
                </button>
              </nav>
            </div>

            {/* Tab Content - Memories */}
            {activeTab === 'memories' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Linked Memories</h3>
                  <button
                    onClick={() => setIsLinkMemoryModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Link Memory
                  </button>
                </div>

                {person.memoryLinks && person.memoryLinks.length > 0 ? (
                  <div className="space-y-2">
                    {person.memoryLinks.map((link) => (
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
                          onClick={() => handleUnlinkMemory(link.memory.id)}
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
                  <button
                    onClick={() => setIsLinkImageModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Link Image
                  </button>
                </div>

                {person.imageLinks && person.imageLinks.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {person.imageLinks.map((link) => (
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
                  <button
                    onClick={() => setIsLinkUrlPageModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Link URL
                  </button>
                </div>

                {person.urlPageLinks && person.urlPageLinks.length > 0 ? (
                  <div className="space-y-2">
                    {person.urlPageLinks.map((link) => (
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
                  <button
                    onClick={() => setIsLinkYouTubeVideoModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Link Video
                  </button>
                </div>

                {person.youtubeVideoLinks && person.youtubeVideoLinks.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {person.youtubeVideoLinks.map((link) => (
                      <div key={link.id} className="group relative rounded-lg overflow-hidden border border-gray-200">
                        <div className="aspect-video relative bg-gray-900">
                          {link.youtubeVideo.thumbnailUrl && (
                            <img
                              src={link.youtubeVideo.thumbnailUrl}
                              alt={link.youtubeVideo.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <button
                            onClick={() => unlinkYouTubeVideoMutation.mutate(link.youtubeVideo.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all"
                            title="Unlink video"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="p-3 bg-white">
                          <h4 className="font-semibold text-gray-900 line-clamp-2 text-sm">
                            {link.youtubeVideo.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {link.youtubeVideo.creatorDisplayName}
                          </p>
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
                  <button
                    onClick={() => setIsLinkTikTokVideoModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Link Video
                  </button>
                </div>

                {person.tiktokVideoLinks && person.tiktokVideoLinks.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {person.tiktokVideoLinks.map((link) => (
                      <div key={link.id} className="group relative rounded-lg overflow-hidden border border-gray-200">
                        <div className="aspect-[9/16] relative bg-gray-900">
                          {link.tiktokVideo.thumbnailUrl && (
                            <img
                              src={link.tiktokVideo.thumbnailUrl}
                              alt={link.tiktokVideo.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <button
                            onClick={() => unlinkTikTokVideoMutation.mutate(link.tiktokVideo.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all"
                            title="Unlink video"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="p-2 bg-white">
                          <p className="text-xs text-gray-900 line-clamp-2 font-medium">
                            {link.tiktokVideo.title}
                          </p>
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

            {/* Tab Content - Relationships */}
            {activeTab === 'relationships' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Relationships</h3>
                  <button
                    onClick={() => setIsLinkPersonModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Link Person
                  </button>
                </div>

                {relationships && relationships.length > 0 ? (
                  <div className="space-y-2">
                    {relationships.map((rel: any) => {
                      const otherPerson = rel.sourcePersonId === personId ? rel.targetPerson : rel.sourcePerson;

                      return (
                        <div
                          key={rel.id}
                          className="flex items-start gap-3 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg group"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">
                                {otherPerson?.displayName || 'Unknown Person'}
                              </h4>
                              {rel.relationshipType && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                  {rel.relationshipType}
                                </span>
                              )}
                            </div>
                            {otherPerson?.email && (
                              <p className="text-sm text-gray-600">{otherPerson.email}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Added {new Date(rel.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/app/people/${otherPerson?.id}`)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title="View person"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Remove this relationship?`)) {
                                  deleteRelationshipMutation.mutate(rel.id);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete relationship"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <p className="text-gray-600">No relationships yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Person
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Link Modals */}
      <PersonLinkMemoryModal
        personId={personId!}
        personName={person.displayName}
        isOpen={isLinkMemoryModalOpen}
        onClose={() => setIsLinkMemoryModalOpen(false)}
        linkedMemoryIds={person.memoryLinks?.map((link) => link.memory.id) || []}
      />

      <PersonLinkImageModal
        personId={personId!}
        personName={person.displayName}
        isOpen={isLinkImageModalOpen}
        onClose={() => setIsLinkImageModalOpen(false)}
        linkedImageIds={person.imageLinks?.map((link) => link.image.id) || []}
      />

      <PersonLinkUrlPageModal
        personId={personId!}
        personName={person.displayName}
        isOpen={isLinkUrlPageModalOpen}
        onClose={() => setIsLinkUrlPageModalOpen(false)}
        linkedUrlPageIds={person.urlPageLinks?.map((link) => link.urlPage.id) || []}
      />

      <PersonLinkYouTubeVideoModal
        personId={personId!}
        personName={person.displayName}
        isOpen={isLinkYouTubeVideoModalOpen}
        onClose={() => setIsLinkYouTubeVideoModalOpen(false)}
        linkedYouTubeVideoIds={person.youtubeVideoLinks?.map((link) => link.youtubeVideo.id) || []}
      />

      <PersonLinkTikTokVideoModal
        personId={personId!}
        personName={person.displayName}
        isOpen={isLinkTikTokVideoModalOpen}
        onClose={() => setIsLinkTikTokVideoModalOpen(false)}
        linkedTikTokVideoIds={person.tiktokVideoLinks?.map((link) => link.tiktokVideo.id) || []}
      />

      <PersonLinkPersonModal
        personId={personId!}
        personName={person.displayName}
        isOpen={isLinkPersonModalOpen}
        onClose={() => setIsLinkPersonModalOpen(false)}
      />
    </div>
  );
}
