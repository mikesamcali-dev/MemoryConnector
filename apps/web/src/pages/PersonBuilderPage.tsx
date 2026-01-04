import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllPeople, createPerson, updatePerson, deletePerson, createPersonRelationship } from '../api/admin';
import { ArrowLeft, User, Plus, Search, Edit, Trash2, Mail, Phone, Link2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PersonBuilderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  // Relationship linking state
  const [selectedPersonForLink, setSelectedPersonForLink] = useState<string | null>(null);
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [relationshipType, setRelationshipType] = useState('');
  const [targetPersonId, setTargetPersonId] = useState<string | null>(null);

  // Fetch all people
  const { data: people, isLoading } = useQuery({
    queryKey: ['people'],
    queryFn: getAllPeople,
  });

  // Create person mutation
  const createPersonMutation = useMutation({
    mutationFn: ({ name, em, ph, biography }: { name: string; em?: string; ph?: string; biography?: string }) => {
      return createPerson(name, em, ph, biography);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      setShowCreateForm(false);
      setDisplayName('');
      setEmail('');
      setPhone('');
      setBio('');
    },
  });

  // Update person mutation
  const updatePersonMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updatePerson(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      setEditingPersonId(null);
      setDisplayName('');
      setEmail('');
      setPhone('');
      setBio('');
    },
  });

  // Delete person mutation with optimistic update
  const deletePersonMutation = useMutation({
    mutationFn: (id: string) => deletePerson(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['people'] });
      const previousPeople = queryClient.getQueryData(['people']);
      queryClient.setQueryData(['people'], (old: any[] | undefined) =>
        old?.filter(person => person.id !== deletedId) ?? []
      );
      return { previousPeople };
    },
    onError: (_err, _deletedId, context: any) => {
      queryClient.setQueryData(['people'], context?.previousPeople);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
  });

  // Create relationship mutation
  const createRelationshipMutation = useMutation({
    mutationFn: ({ sourceId, targetId, type }: { sourceId: string; targetId: string; type: string }) => {
      return createPersonRelationship(sourceId, targetId, type);
    },
    onError: (error) => {
      console.error('Failed to create relationship:', error);
      alert(`Failed to create relationship: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      setShowRelationshipModal(false);
      setRelationshipType('');
      setSelectedPersonForLink(null);
      setTargetPersonId(null);
    },
  });

  // Filter people based on search
  const filteredPeople = people?.filter((person) =>
    person.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCreatePerson = () => {
    if (!displayName.trim()) return;

    createPersonMutation.mutate({
      name: displayName.trim(),
      em: email || undefined,
      ph: phone || undefined,
      biography: bio || undefined,
    });
  };

  const handlePersonClick = (personId: string) => {
    // Navigate to person detail page
    navigate(`/app/people/${personId}`);
  };

  const handleLinkClick = (personId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // If no person selected yet, select this one
    if (!selectedPersonForLink) {
      setSelectedPersonForLink(personId);
      return;
    }

    // If clicking the same person, deselect
    if (selectedPersonForLink === personId) {
      setSelectedPersonForLink(null);
      return;
    }

    // If a different person is clicked, show relationship modal
    setTargetPersonId(personId);
    setShowRelationshipModal(true);
  };

  const handleCreateRelationship = () => {
    console.log('handleCreateRelationship called', {
      selectedPersonForLink,
      targetPersonId,
      relationshipType: relationshipType.trim(),
    });

    if (!selectedPersonForLink || !targetPersonId || !relationshipType.trim()) {
      console.log('Validation failed - missing required fields');
      return;
    }

    console.log('Creating relationship...');
    createRelationshipMutation.mutate({
      sourceId: selectedPersonForLink,
      targetId: targetPersonId,
      type: relationshipType.trim(),
    });
  };

  const cancelRelationshipLink = () => {
    setSelectedPersonForLink(null);
    setShowRelationshipModal(false);
    setRelationshipType('');
    setTargetPersonId(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/app/capture')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-3 mb-2">
          <User className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Person Builder</h1>
        </div>
        <p className="text-gray-600">
          Create and manage people for your memories
        </p>
      </div>

      {/* Linking Mode Banner */}
      {selectedPersonForLink && (
        <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Linking Mode Active</p>
                <p className="text-sm text-blue-700">
                  Selected: {people?.find(p => p.id === selectedPersonForLink)?.displayName || 'Unknown'}.
                  Click another person to create a relationship.
                </p>
              </div>
            </div>
            <button
              onClick={cancelRelationshipLink}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded"
              title="Cancel linking"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Create Person Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          {showCreateForm ? 'Cancel' : 'Create New Person'}
        </button>
      </div>

      {/* Create Person Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Person</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., John Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio (optional)
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Brief biography or notes about this person..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCreatePerson}
                disabled={!displayName.trim() || createPersonMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createPersonMutation.isPending ? 'Creating...' : 'Create Person'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setDisplayName('');
                  setEmail('');
                  setPhone('');
                  setBio('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search people..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* People List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            All People ({filteredPeople.length})
          </h2>

          {isLoading ? (
            <div className="text-center py-8 text-gray-600">Loading people...</div>
          ) : filteredPeople.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? `No people found matching "${searchTerm}"` : 'No people yet. Create your first person above!'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPeople.map((person) => (
                <div key={person.id}>
                  {editingPersonId === person.id ? (
                    // Edit Form
                    <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Person</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Display Name *
                          </label>
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="email@example.com"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="(555) 123-4567"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bio
                          </label>
                          <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            placeholder="Brief biography or notes..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => {
                              updatePersonMutation.mutate({
                                id: person.id,
                                data: {
                                  displayName,
                                  email: email || undefined,
                                  phone: phone || undefined,
                                  bio: bio || undefined,
                                },
                              });
                            }}
                            disabled={!displayName.trim() || updatePersonMutation.isPending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {updatePersonMutation.isPending ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingPersonId(null);
                              setDisplayName('');
                              setEmail('');
                              setPhone('');
                              setBio('');
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div
                      className={`flex items-start justify-between p-4 border-2 rounded-lg transition-all cursor-pointer ${
                        selectedPersonForLink === person.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handlePersonClick(person.id)}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <User className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 mb-1">
                            {person.displayName}
                          </div>
                          {person.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <Mail className="h-3.5 w-3.5" />
                              {person.email}
                            </div>
                          )}
                          {person.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <Phone className="h-3.5 w-3.5" />
                              {person.phone}
                            </div>
                          )}
                          {person.bio && (
                            <div className="text-sm text-gray-500 mt-2">
                              {person.bio}
                            </div>
                          )}
                          {person._count && person._count.memories > 0 && (
                            <div className="text-xs text-blue-600 mt-2">
                              {person._count.memories} {person._count.memories === 1 ? 'memory' : 'memories'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleLinkClick(person.id, e)}
                          className={`p-2 rounded ${
                            selectedPersonForLink === person.id
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                          }`}
                          title="Create relationship"
                        >
                          <Link2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingPersonId(person.id);
                            setDisplayName(person.displayName);
                            setEmail(person.email || '');
                            setPhone(person.phone || '');
                            setBio(person.bio || '');
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit person"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${person.displayName}"?`)) {
                              deletePersonMutation.mutate(person.id);
                            }
                          }}
                          disabled={deletePersonMutation.isPending}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Delete person"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Relationship Modal */}
      {showRelationshipModal && selectedPersonForLink && targetPersonId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create Relationship</h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Creating relationship between:
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-blue-600">
                  {people?.find(p => p.id === selectedPersonForLink)?.displayName}
                </span>
                <span className="text-gray-400">→</span>
                <span className="font-semibold text-blue-600">
                  {people?.find(p => p.id === targetPersonId)?.displayName}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="relationshipType" className="block text-sm font-medium text-gray-700 mb-2">
                Relationship Type *
              </label>
              <input
                type="text"
                id="relationshipType"
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value)}
                placeholder="e.g., spouse, parent, colleague, friend"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && relationshipType.trim()) {
                    handleCreateRelationship();
                  }
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateRelationship}
                disabled={!relationshipType.trim() || createRelationshipMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createRelationshipMutation.isPending ? 'Creating...' : 'Create Relationship'}
              </button>
              <button
                onClick={cancelRelationshipLink}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
