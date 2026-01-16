import { useParams, useNavigate } from 'react-router-dom';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useQuery } from '@tanstack/react-query';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { getLocationMemories, getLocation } from '../api/admin';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { ArrowLeft, MapPin, Calendar, FileText } from 'lucide-react';

import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
export function LocationMemoriesPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();

  // Fetch location details
  const { data: location, isLoading: locationLoading } = useQuery({
    queryKey: ['location', locationId],
    queryFn: () => getLocation(locationId!),
    enabled: !!locationId,
  });

  // Fetch memories for this location
  const { data: memories, isLoading: memoriesLoading } = useQuery({
    queryKey: ['location-memories', locationId],
    queryFn: () => getLocationMemories(locationId!),
    enabled: !!locationId,
  });

  const isLoading = locationLoading || memoriesLoading;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/app/locations')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Locations
        </button>

        {location && (
          <div className="flex items-start gap-3 mb-2">
            <MapPin className="h-8 w-8 text-blue-600 mt-1" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {location.name}
              </h1>
              {location.address && (
                <p className="text-gray-600 text-sm">{location.address}</p>
              )}
              {(location.city || location.state || location.country) && (
                <p className="text-gray-500 text-sm">
                  {[location.city, location.state, location.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              {location.placeType && (
                <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  {location.placeType}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Memories List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Memories at this Location ({memories?.length || 0})
          </h2>

          {isLoading ? (
            <div className="text-center py-8 text-gray-600">
              Loading memories...
            </div>
          ) : !memories || memories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No memories at this location yet</p>
              <button
                onClick={() => navigate('/app/capture')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Memory
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {memories.map((memory: any) => (
                <div
                  key={memory.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/app/memories/${memory.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {memory.title && (
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {memory.title}
                        </h3>
                      )}
                      {memory.body && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {memory.body}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(memory.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>

                    {memory.user && (
                      <div className="flex items-center gap-1">
                        <span>by {memory.user.email}</span>
                      </div>
                    )}

                    {memory.state && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        memory.state === 'ENRICHED' ? 'bg-green-100 text-green-800' :
                        memory.state === 'ENRICHING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {memory.state}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Help Popup */}
      <HelpPopup
        pageKey="locations"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}