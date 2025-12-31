import { useState } from 'react';
import { X, MapPin, Loader, Sparkles } from 'lucide-react';
import { previewLocationEnrichment, createLocation } from '../api/admin';

interface LocationBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAddress?: string;
  onLocationCreated?: (locationId: string) => void;
}

export function LocationBuilderModal({
  isOpen,
  onClose,
  initialAddress = '',
  onLocationCreated,
}: LocationBuilderModalProps) {
  const [address, setAddress] = useState(initialAddress);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [placeType, setPlaceType] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [enriched, setEnriched] = useState(false);

  if (!isOpen) return null;

  const handleEnrich = async () => {
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    try {
      setIsEnriching(true);
      setError('');

      const enrichedData = await previewLocationEnrichment(address);

      // Set the name to the address if not already set
      if (!name) {
        setName(address);
      }

      // Fill in the enriched fields
      if (enrichedData.address) setAddress(enrichedData.address);
      if (enrichedData.city) setCity(enrichedData.city);
      if (enrichedData.state) setState(enrichedData.state);
      if (enrichedData.country) setCountry(enrichedData.country);
      if (enrichedData.latitude !== null) setLatitude(enrichedData.latitude.toString());
      if (enrichedData.longitude !== null) setLongitude(enrichedData.longitude.toString());
      if (enrichedData.placeType) setPlaceType(enrichedData.placeType);

      setEnriched(true);
    } catch (err: any) {
      console.error('Failed to enrich location:', err);
      setError(err.message || 'Failed to enrich location');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a location name');
      return;
    }

    try {
      setIsCreating(true);
      setError('');

      const lat = latitude ? parseFloat(latitude) : undefined;
      const lng = longitude ? parseFloat(longitude) : undefined;

      const location = await createLocation(
        name,
        lat,
        lng,
        address || undefined,
        city || undefined,
        state || undefined,
        country || undefined,
        placeType || undefined,
      );

      if (onLocationCreated) {
        onLocationCreated(location.id);
      }

      // Reset form
      setAddress('');
      setName('');
      setCity('');
      setState('');
      setCountry('');
      setLatitude('');
      setLongitude('');
      setPlaceType('');
      setEnriched(false);

      onClose();
    } catch (err: any) {
      console.error('Failed to create location:', err);
      setError(err.message || 'Failed to create location');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Location Builder</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {enriched && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span>Location enriched with AI! Review and edit fields below.</span>
            </div>
          )}

          {/* Address Input */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address or Location Name *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 1600 Pennsylvania Ave NW, Washington, DC"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
              <button
                onClick={handleEnrich}
                disabled={isEnriching || !address.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                {isEnriching ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Enriching...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Enrich with AI
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter an address and click "Enrich with AI" to auto-fill details
            </p>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., White House, Home, Office"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* City, State, Country - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Washington"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State/Province
              </label>
              <input
                type="text"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g., DC"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g., USA"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Coordinates - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="text"
                id="latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g., 38.8977"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="text"
                id="longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g., -77.0365"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Place Type */}
          <div>
            <label htmlFor="placeType" className="block text-sm font-medium text-gray-700 mb-1">
              Place Type
            </label>
            <input
              type="text"
              id="placeType"
              value={placeType}
              onChange={(e) => setPlaceType(e.target.value)}
              placeholder="e.g., landmark, restaurant, park"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
            className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Location'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
