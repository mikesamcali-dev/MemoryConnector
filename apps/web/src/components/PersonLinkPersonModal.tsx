import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search, Users } from 'lucide-react';
import { getAllPeople, createPersonRelationship, getPersonRelationships } from '../api/people';

interface PersonLinkPersonModalProps {
  personId: string;
  personName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PersonLinkPersonModal({
  personId,
  personName,
  isOpen,
  onClose,
}: PersonLinkPersonModalProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [relationshipType, setRelationshipType] = useState('');

  // Fetch all people
  const { data: people, isLoading } = useQuery({
    queryKey: ['people-all'],
    queryFn: () => getAllPeople(),
    enabled: isOpen,
  });

  // Fetch existing relationships
  const { data: relationships } = useQuery({
    queryKey: ['person-relationships', personId],
    queryFn: () => getPersonRelationships(personId),
    enabled: isOpen,
  });

  const linkMutation = useMutation({
    mutationFn: ({ targetPersonId, relType }: { targetPersonId: string; relType: string }) =>
      createPersonRelationship(personId, targetPersonId, relType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person', personId] });
      queryClient.invalidateQueries({ queryKey: ['person-relationships', personId] });
      setSelectedPersonId(null);
      setRelationshipType('');
    },
  });

  const handleLink = () => {
    if (selectedPersonId && relationshipType.trim()) {
      linkMutation.mutate({ targetPersonId: selectedPersonId, relType: relationshipType.trim() });
    }
  };

  if (!isOpen) return null;

  // Get IDs of people already linked
  const linkedPersonIds = new Set(
    relationships?.map((rel: any) =>
      rel.sourcePersonId === personId ? rel.targetPersonId : rel.sourcePersonId
    ) || []
  );

  // Filter people (exclude current person and filter by search)
  const filteredPeople = people?.filter((person: any) => {
    if (person.id === personId) return false; // Exclude self
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      person.displayName?.toLowerCase().includes(searchLower) ||
      person.email?.toLowerCase().includes(searchLower) ||
      person.phone?.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-600" />
              Link Person to "{personName}"
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Create a relationship with another person
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search people by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Loading people...</p>
            </div>
          )}

          {!isLoading && filteredPeople.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No people found</p>
              {searchTerm && (
                <p className="text-sm text-gray-500 mt-2">Try a different search term</p>
              )}
            </div>
          )}

          {!isLoading && filteredPeople.length > 0 && (
            <div className="space-y-2">
              {filteredPeople.map((person: any) => {
                const isLinked = linkedPersonIds.has(person.id);
                const isSelected = selectedPersonId === person.id;

                return (
                  <div
                    key={person.id}
                    className={`p-4 border rounded-lg transition-all cursor-pointer ${
                      isLinked
                        ? 'border-green-300 bg-green-50'
                        : isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                    onClick={() => !isLinked && setSelectedPersonId(person.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">
                          {person.displayName}
                        </h3>
                        {person.email && (
                          <p className="text-sm text-gray-600 mt-1">{person.email}</p>
                        )}
                        {person.phone && (
                          <p className="text-sm text-gray-600">{person.phone}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {isLinked && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-600 text-white">
                            Linked ✓
                          </span>
                        )}
                        {!isLinked && isSelected && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-600 text-white">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Relationship Type Input & Actions */}
        {selectedPersonId && !linkedPersonIds.has(selectedPersonId) && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relationship Type
            </label>
            <input
              type="text"
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              placeholder="e.g., Friend, Colleague, Family, Mentor..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && relationshipType.trim()) {
                  handleLink();
                }
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleLink}
                disabled={!relationshipType.trim() || linkMutation.isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {linkMutation.isPending ? 'Linking...' : 'Create Relationship'}
              </button>
              <button
                onClick={() => {
                  setSelectedPersonId(null);
                  setRelationshipType('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {linkedPersonIds.size} {linkedPersonIds.size === 1 ? 'relationship' : 'relationships'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
