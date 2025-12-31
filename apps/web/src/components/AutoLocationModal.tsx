import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, MapPin, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { discoverNearbyBusinesses, batchCreateLocations, Location } from '../api/admin';

interface AutoLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AutoLocationModal({ isOpen, onClose }: AutoLocationModalProps) {
  const [step, setStep] = useState<'permission' | 'discovering' | 'results'>('permission');
  const [newLocations, setNewLocations] = useState<Location[]>([]);
  const [existingLocations, setExistingLocations] = useState<Location[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const discoverMutation = useMutation({
    mutationFn: async (coords: { latitude: number; longitude: number }) => {
      return discoverNearbyBusinesses(coords.latitude, coords.longitude, 1000);
    },
    onSuccess: (data) => {
      setNewLocations(data.new);
      setExistingLocations(data.existing);
      setStep('results');
      // Select all new locations by default
      setSelectedLocations(new Set(data.new.map((_, i) => i)));
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to discover nearby businesses');
      setStep('permission');
    },
  });

  const batchCreateMutation = useMutation({
    mutationFn: async (locations: any[]) => {
      return batchCreateLocations(locations);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      onClose();
      resetModal();
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create locations');
    },
  });

  const handleRequestLocation = () => {
    setStep('discovering');
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setStep('permission');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        discoverMutation.mutate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (err) => {
        setError(`Unable to get location: ${err.message}`);
        setStep('permission');
      }
    );
  };

  const toggleLocation = (index: number) => {
    const newSelected = new Set(selectedLocations);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLocations(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedLocations(new Set(newLocations.map((_, i) => i)));
  };

  const handleDeselectAll = () => {
    setSelectedLocations(new Set());
  };

  const handleAddSelected = () => {
    const locationsToAdd = Array.from(selectedLocations).map(index => {
      const location = newLocations[index];
      // Only include properties that the backend expects
      return {
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        city: location.city,
        state: location.state,
        zip: location.zip,
        country: location.country,
        placeType: location.placeType,
      };
    });
    batchCreateMutation.mutate(locationsToAdd);
  };

  const resetModal = () => {
    setStep('permission');
    setNewLocations([]);
    setExistingLocations([]);
    setSelectedLocations(new Set());
    setError(null);
  };

  const handleClose = () => {
    onClose();
    resetModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Auto-Discover Locations</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Permission Step */}
          {step === 'permission' && (
            <div className="text-center py-8">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Discover Nearby Businesses
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We'll use your current location to find nearby businesses and places within 1km.
                You can then select which ones to add to your location list.
              </p>
              <button
                onClick={handleRequestLocation}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Get My Location
              </button>
            </div>
          )}

          {/* Discovering Step */}
          {step === 'discovering' && (
            <div className="text-center py-8">
              <Loader className="h-16 w-16 mx-auto mb-4 text-blue-600 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Searching for nearby businesses...
              </h3>
              <p className="text-gray-600">This may take a few moments</p>
            </div>
          )}

          {/* Results Step */}
          {step === 'results' && (
            <div>
              {/* Summary */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Discovery Complete</h3>
                </div>
                <p className="text-sm text-blue-800">
                  Found {newLocations.length} new location{newLocations.length !== 1 ? 's' : ''} and{' '}
                  {existingLocations.length} already in your list
                </p>
              </div>

              {/* Selection Controls */}
              {newLocations.length > 0 && (
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {selectedLocations.size} of {newLocations.length} selected
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={handleDeselectAll}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
              )}

              {/* New Locations List */}
              {newLocations.length > 0 ? (
                <div className="space-y-2 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">New Locations</h4>
                  {newLocations.map((location, index) => (
                    <label
                      key={index}
                      className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLocations.has(index)}
                        onChange={() => toggleLocation(index)}
                        className="mt-1 h-4 w-4 text-blue-600 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{location.name}</p>
                        {location.address && (
                          <p className="text-sm text-gray-600 truncate">{location.address}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {[location.city, location.state, location.country]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                        {location.placeType && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                            {location.placeType}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No new locations found nearby</p>
                  <p className="text-sm mt-2">All nearby businesses are already in your list</p>
                </div>
              )}

              {/* Existing Locations (if any) */}
              {existingLocations.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Already in Your List</h4>
                  <div className="space-y-2">
                    {existingLocations.map((location, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{location.name}</p>
                          {location.address && (
                            <p className="text-sm text-gray-600 truncate">{location.address}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {[location.city, location.state, location.country]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'results' && newLocations.length > 0 && (
          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSelected}
              disabled={selectedLocations.size === 0 || batchCreateMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {batchCreateMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  Add {selectedLocations.size > 0 ? selectedLocations.size : ''} Location
                  {selectedLocations.size !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
