import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMemory, updateMemory, linkWordsToMemory } from '../api/memories';
import { getAllEvents, getAllLocationsForUser, getAllPeople, createEvent, createLocation, getAllYouTubeVideos } from '../api/admin';
import {
  getMemoryRelationships,
  deleteMemoryRelationship,
} from '../api/memoryRelationships';
import { getAllWords } from '../api/words';
import { getAllProjects, linkMemoryToProject } from '../api/projects';
import { ArrowLeft, Save, Link as LinkIcon, Plus, X, Trash2, MapPin, Video, BookOpen, FolderKanban } from 'lucide-react';

export function LinkMemoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [textContent, setTextContent] = useState('');
  const [originalTextContent, setOriginalTextContent] = useState('');
  const [linkType, setLinkType] = useState<'person' | 'event' | 'location' | 'video' | 'word' | 'project' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);

  // Fetch the memory
  const { data: memory, isLoading, isError, error } = useQuery({
    queryKey: ['memory', id],
    queryFn: () => getMemory(id!),
    enabled: !!id,
    retry: 3,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (memory) {
      const content = memory.body || memory.title || '';
      setTextContent(content);
      setOriginalTextContent(content);
    }
  }, [memory]);

  // Fetch search results based on linkType
  const { data: people } = useQuery({
    queryKey: ['people'],
    queryFn: getAllPeople,
    enabled: linkType === 'person',
  });

  const { data: events } = useQuery({
    queryKey: ['admin-events'],
    queryFn: getAllEvents,
    enabled: linkType === 'event',
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: getAllLocationsForUser,
    enabled: linkType === 'location',
  });

  const { data: videos } = useQuery({
    queryKey: ['youtube-videos'],
    queryFn: () => getAllYouTubeVideos(0, 100),
    enabled: linkType === 'video',
  });

  const { data: words } = useQuery({
    queryKey: ['words'],
    queryFn: getAllWords,
    enabled: linkType === 'word',
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: getAllProjects,
    enabled: linkType === 'project',
  });

  // Fetch relationships
  const { data: relationships } = useQuery({
    queryKey: ['memory-relationships', id],
    queryFn: () => getMemoryRelationships(id!),
    enabled: !!id,
  });

  // Update memory mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => updateMemory(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory', id] });
      // Update original text content after successful save
      setOriginalTextContent(textContent);
    },
  });

  // Link memory mutations
  const linkPersonMutation = useMutation({
    mutationFn: (personId: string) =>
      updateMemory(id!, { personId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory', id] });
      navigate(`/app/memories/${id}`);
    },
  });

  const linkEventMutation = useMutation({
    mutationFn: (eventId: string) =>
      updateMemory(id!, { eventId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory', id] });
      navigate(`/app/memories/${id}`);
    },
  });

  const linkLocationMutation = useMutation({
    mutationFn: (locationId: string) =>
      updateMemory(id!, { locationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory', id] });
      navigate(`/app/memories/${id}`);
    },
  });

  const linkVideoMutation = useMutation({
    mutationFn: (youtubeVideoId: string) =>
      updateMemory(id!, { youtubeVideoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory', id] });
      navigate(`/app/memories/${id}`);
    },
  });

  const linkWordMutation = useMutation({
    mutationFn: (word: string) =>
      linkWordsToMemory(id!, [word]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory', id] });
      navigate(`/app/memories/${id}`);
    },
  });

  const linkProjectMutation = useMutation({
    mutationFn: (projectId: string) =>
      linkMemoryToProject(projectId, id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory', id] });
      navigate(`/app/memories/${id}`);
    },
  });

  const unlinkRelationshipMutation = useMutation({
    mutationFn: (relationshipId: string) => deleteMemoryRelationship(relationshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory-relationships', id] });
    },
  });

  // Create new entity mutations
  const createEventMutation = useMutation({
    mutationFn: (name: string) => createEvent(name),
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      // Link the new event to the memory (which will auto-navigate)
      linkEventMutation.mutate(event.id);
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: ({ name, lat, lng }: { name: string; lat?: number; lng?: number }) => {
      return createLocation(name, lat, lng);
    },
    onSuccess: (location) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setShowLocationForm(false);
      setNewLocationName('');
      setLatitude('');
      setLongitude('');
      // Link the new location to the memory (which will auto-navigate)
      linkLocationMutation.mutate(location.id);
    },
  });

  // Get current GPS location
  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
          setGettingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error.message);
          setGettingLocation(false);
          alert('Could not get your current location. Please enter coordinates manually.');
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Filter results based on search term
  const filteredResults = () => {
    const term = searchTerm.toLowerCase();

    if (linkType === 'person') {
      // Show all people when no search term, or filter when searching
      return searchTerm
        ? people?.filter((p) => p.displayName.toLowerCase().includes(term)) || []
        : people || [];
    }
    if (linkType === 'event') {
      return searchTerm ? events?.filter((e) => e.name.toLowerCase().includes(term)) || [] : [];
    }
    if (linkType === 'location') {
      // Show all locations when no search term, or filter when searching
      return searchTerm
        ? locations?.filter((l) => l.name.toLowerCase().includes(term)) || []
        : locations || [];
    }
    if (linkType === 'video') {
      // Show all videos when no search term, or filter when searching
      return searchTerm
        ? videos?.filter((v) => v.title.toLowerCase().includes(term) || v.description?.toLowerCase().includes(term)) || []
        : videos || [];
    }
    if (linkType === 'word') {
      // Show all words when no search term, or filter when searching
      return searchTerm
        ? words?.filter((w) => w.word.toLowerCase().includes(term)) || []
        : words || [];
    }
    if (linkType === 'project') {
      // Show all projects when no search term, or filter when searching
      return searchTerm
        ? projects?.filter((p) => p.name.toLowerCase().includes(term)) || []
        : projects || [];
    }

    return [];
  };

  const handleLinkClick = (itemId: string) => {
    if (linkType === 'person') {
      linkPersonMutation.mutate(itemId);
    } else if (linkType === 'event') {
      linkEventMutation.mutate(itemId);
    } else if (linkType === 'location') {
      linkLocationMutation.mutate(itemId);
    } else if (linkType === 'video') {
      linkVideoMutation.mutate(itemId);
    } else if (linkType === 'word') {
      linkWordMutation.mutate(itemId);
    } else if (linkType === 'project') {
      linkProjectMutation.mutate(itemId);
    }
  };

  const handleCreateNew = () => {
    if (linkType === 'event' && searchTerm.trim()) {
      createEventMutation.mutate(searchTerm.trim());
    } else if (linkType === 'location') {
      setShowLocationForm(true);
      if (searchTerm.trim()) {
        setNewLocationName(searchTerm.trim());
      }
    }
    // Note: People are created via Person Builder page, not here
  };

  const handleCreateLocation = () => {
    if (!newLocationName.trim()) return;

    const lat = latitude ? parseFloat(latitude) : undefined;
    const lng = longitude ? parseFloat(longitude) : undefined;

    createLocationMutation.mutate({
      name: newLocationName.trim(),
      lat,
      lng,
    });
  };

  const handleSaveAndContinue = () => {
    navigate('/app/capture');
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

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Error loading memory: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
        <button
          onClick={() => navigate('/app/search')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Search
        </button>
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Memory not found</div>
        </div>
      </div>
    );
  }

  const results = filteredResults();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/app/search')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Skip Linking
        </button>

        <h1 className="text-3xl font-bold text-gray-900">Link Your Memory</h1>
        <p className="text-gray-600 mt-2">
          Connect this memory to people, events, locations, videos, or words
        </p>
      </div>

      {/* Memory Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Memory</h2>
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={3}
          placeholder="Edit your memory..."
        />
        {textContent !== originalTextContent && (
          <button
            onClick={() => updateMutation.mutate({ textContent })}
            disabled={updateMutation.isPending}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* AI Extracted Entities */}
      {/* Link Options */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Add Links
        </h2>

        {/* Link Type Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => {
              setLinkType('person');
              setSearchTerm('');
            }}
            className={`p-4 border-2 rounded-lg text-center transition-all ${
              linkType === 'person'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">👤 Person</div>
            <div className="text-xs text-gray-500 mt-1">Link to a person</div>
          </button>

          <button
            onClick={() => {
              setLinkType('event');
              setSearchTerm('');
            }}
            className={`p-4 border-2 rounded-lg text-center transition-all ${
              linkType === 'event'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">🎉 Event</div>
            <div className="text-xs text-gray-500 mt-1">Link to an event</div>
          </button>

          <button
            onClick={() => {
              setLinkType('location');
              setSearchTerm('');
            }}
            className={`p-4 border-2 rounded-lg text-center transition-all ${
              linkType === 'location'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">📍 Location</div>
            <div className="text-xs text-gray-500 mt-1">Link to a place</div>
          </button>

          <button
            onClick={() => {
              setLinkType('video');
              setSearchTerm('');
            }}
            className={`p-4 border-2 rounded-lg text-center transition-all ${
              linkType === 'video'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold flex items-center justify-center gap-2">
              <Video className="h-4 w-4" />
              Video
            </div>
            <div className="text-xs text-gray-500 mt-1">Link to a YouTube video</div>
          </button>

          <button
            onClick={() => {
              setLinkType('word');
              setSearchTerm('');
            }}
            className={`p-4 border-2 rounded-lg text-center transition-all ${
              linkType === 'word'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold flex items-center justify-center gap-2">
              <BookOpen className="h-4 w-4" />
              Word
            </div>
            <div className="text-xs text-gray-500 mt-1">Link to a word/phrase</div>
          </button>

          <button
            onClick={() => {
              setLinkType('project');
              setSearchTerm('');
            }}
            className={`p-4 border-2 rounded-lg text-center transition-all ${
              linkType === 'project'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold flex items-center justify-center gap-2">
              <FolderKanban className="h-4 w-4" />
              Project
            </div>
            <div className="text-xs text-gray-500 mt-1">Link to a project</div>
          </button>
        </div>

        {/* Link Search */}
        {linkType && (
          <div className="border-t pt-4">
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search for ${linkType}...`}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                autoFocus
              />
            </div>

            {/* Location Builder Form */}
            {linkType === 'location' && showLocationForm && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Location
                </h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="newLocationName" className="block text-sm font-medium text-gray-700 mb-1">
                      Location Name *
                    </label>
                    <input
                      type="text"
                      id="newLocationName"
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                      placeholder="e.g., Home, Office, Coffee Shop"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="lat" className="block text-sm font-medium text-gray-700 mb-1">
                        Latitude
                      </label>
                      <input
                        type="text"
                        id="lat"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="e.g., 37.7749"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="lng" className="block text-sm font-medium text-gray-700 mb-1">
                        Longitude
                      </label>
                      <input
                        type="text"
                        id="lng"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="e.g., -122.4194"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    <MapPin className="h-4 w-4" />
                    {gettingLocation ? 'Getting location...' : 'Use Current GPS Location'}
                  </button>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleCreateLocation}
                      disabled={!newLocationName.trim() || createLocationMutation.isPending}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {createLocationMutation.isPending ? 'Creating...' : 'Create & Link'}
                    </button>
                    <button
                      onClick={() => {
                        setShowLocationForm(false);
                        setNewLocationName('');
                        setLatitude('');
                        setLongitude('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Search Results */}
            {linkType && (
              <div className="space-y-3">
                {/* Create New Button - Show for events and locations */}
                {linkType === 'event' && (
                  <button
                    onClick={handleCreateNew}
                    disabled={createEventMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="font-medium">
                      {createEventMutation.isPending
                        ? 'Creating...'
                        : `Create new event: "${searchTerm}"`}
                    </span>
                  </button>
                )}

                {linkType === 'location' && !showLocationForm && (
                  <button
                    onClick={handleCreateNew}
                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="font-medium">Create new location</span>
                  </button>
                )}

                {/* Search Results List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500">
                        {linkType === 'event' || linkType === 'location'
                          ? `No existing ${linkType}s found. Click "Create new" above to add it!`
                          : `No ${linkType}s found matching "${searchTerm}"`}
                      </p>
                    </div>
                  ) : (
                    results.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleLinkClick(linkType === 'word' ? item.word : item.id)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {linkType === 'event' && item.name}
                            {linkType === 'person' && item.displayName}
                            {linkType === 'location' && item.name}
                            {linkType === 'video' && item.title}
                            {linkType === 'word' && item.word}
                            {linkType === 'project' && item.name}
                          </div>
                          {linkType === 'person' && item.email && (
                            <div className="text-xs text-gray-500 mt-1">{item.email}</div>
                          )}
                          {linkType === 'video' && item.creatorDisplayName && (
                            <div className="text-xs text-gray-500 mt-1">{item.creatorDisplayName}</div>
                          )}
                          {linkType === 'location' && (item.address || item.city || item.state) && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.address && <div>{item.address}</div>}
                              {(item.city || item.state || item.country) && (
                                <div>
                                  {[item.city, item.state, item.country]
                                    .filter(Boolean)
                                    .join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                          {linkType === 'location' && item.placeType && (
                            <div className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                              {item.placeType}
                            </div>
                          )}
                          {linkType === 'project' && item._count?.memoryLinks && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item._count.memoryLinks} memories
                            </div>
                          )}
                          {item.description && linkType !== 'location' && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                        <button
                          className="ml-3 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLinkClick(linkType === 'word' ? item.word : item.id);
                          }}
                        >
                          Link
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Links */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Links</h2>
        <div className="space-y-2">
          {/* Word Links */}
{/* Word Links */}
          {memory?.wordLinks && memory.wordLinks.length > 0 && (
            memory.wordLinks.map((link: any) => (
              <div key={link.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📚</span>
                  <div>
                    <div className="font-medium text-gray-900">{link.word.word}</div>
                    <div className="text-xs text-gray-500">Word</div>
                  </div>
                </div>
                <button
                  onClick={() => {/* TODO: Implement word link removal */}}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                  title="Unlink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          )}

          {/* Event Link */}
          {memory?.event && (
            <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎉</span>
                <div>
                  <div className="font-medium text-gray-900">{memory.event.name}</div>
                  <div className="text-xs text-gray-500">Event</div>
                </div>
              </div>
              <button
                onClick={() => updateMutation.mutate({ eventId: null })}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
                title="Unlink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Person Link */}
          {memory?.person && (
            <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👤</span>
                <div>
                  <div className="font-medium text-gray-900">{memory.person.displayName}</div>
                  {memory.person.email && (
                    <div className="text-xs text-gray-600">{memory.person.email}</div>
                  )}
                  <div className="text-xs text-gray-500">Person</div>
                </div>
              </div>
              <button
                onClick={() => updateMutation.mutate({ personId: null })}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
                title="Unlink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Location Link */}
          {memory?.location && (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2 flex-1">
                <span className="text-2xl">📍</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{memory.location.name}</div>
                  {memory.location.address && (
                    <div className="text-xs text-gray-600 mt-0.5">{memory.location.address}</div>
                  )}
                  {(memory.location.city || memory.location.state || memory.location.country) && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {[memory.location.city, memory.location.state, memory.location.country]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  )}
                  {memory.location.placeType && (
                    <div className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                      {memory.location.placeType}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-0.5">Location</div>
                </div>
              </div>
              <button
                onClick={() => updateMutation.mutate({ locationId: null })}
                className="p-1 text-red-600 hover:bg-red-100 rounded flex-shrink-0"
                title="Unlink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* YouTube Video Link */}
          {memory?.youtubeVideo && (
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2 flex-1">
                <Video className="h-6 w-6 text-red-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{memory.youtubeVideo.title}</div>
                  {memory.youtubeVideo.creatorDisplayName && (
                    <div className="text-xs text-gray-600 mt-0.5">{memory.youtubeVideo.creatorDisplayName}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-0.5">YouTube Video</div>
                </div>
              </div>
              <button
                onClick={() => updateMutation.mutate({ youtubeVideoId: null })}
                className="p-1 text-red-600 hover:bg-red-100 rounded flex-shrink-0"
                title="Unlink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Memory Relationships */}
          {relationships?.map((rel) => (
            <div
              key={rel.id}
              className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔗</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 line-clamp-1">
                    {rel.relatedMemory.textContent || 'Untitled memory'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {rel.relationshipType} • {new Date(rel.relatedMemory.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => unlinkRelationshipMutation.mutate(rel.id)}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
                title="Unlink"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {!memory?.wordLinks?.length && !memory?.event && !memory?.person && !memory?.location && !memory?.youtubeVideo && !relationships?.length && (
            <p className="text-sm text-gray-500 text-center py-4">
              No links yet. Add links above to connect this memory.
            </p>
          )}
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate(`/app/memories/${id}`)}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          View Memory Details
        </button>
        <button
          onClick={handleSaveAndContinue}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Done
        </button>
      </div>
    </div>
  );
}
