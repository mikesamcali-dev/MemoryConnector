import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { searchMemories } from '../api/search';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationMemory {
  id: string;
  title?: string;
  body?: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

export function AtlasPage() {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);

  // Fetch all memories with location data
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['location-memories'],
    queryFn: () => searchMemories(''), // Fetch all memories
  });

  const locationMemories = useMemo(() => {
    if (!searchResults?.memories) return [];

    return searchResults.memories
      .filter(m => m.latitude && m.longitude)
      .map(m => ({
        id: m.id,
        title: m.title,
        body: m.body,
        latitude: m.latitude!,
        longitude: m.longitude!,
        createdAt: m.createdAt,
      }));
  }, [searchResults]);

  // Group memories by location (within 50m radius)
  const groupedLocations = useMemo(() => {
    const groups: { [key: string]: LocationMemory[] } = {};

    locationMemories.forEach(memory => {
      // Round to 3 decimal places (~100m precision)
      const key = `${memory.latitude.toFixed(3)},${memory.longitude.toFixed(3)}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(memory);
    });

    return Object.entries(groups).map(([key, memories]) => {
      const [lat, lng] = key.split(',').map(Number);
      return {
        lat,
        lng,
        memories,
        count: memories.length,
      };
    });
  }, [locationMemories]);

  const defaultCenter: [number, number] = locationMemories.length > 0
    ? [locationMemories[0].latitude, locationMemories[0].longitude]
    : [37.7749, -122.4194]; // San Francisco default

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading map...</div>
      </div>
    );
  }

  if (locationMemories.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No location-tagged memories yet</p>
          <p className="text-sm text-gray-500">
            Add location information when creating memories to see them on the map
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Atlas</h1>
          <div className="text-sm text-gray-600">
            {locationMemories.length} memories • {groupedLocations.length} locations
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={selectedLocation || defaultCenter}
          zoom={13}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {selectedLocation && <MapUpdater center={selectedLocation} />}

          <MarkerClusterGroup chunkedLoading>
            {groupedLocations.map((location, idx) => (
              <Marker
                key={idx}
                position={[location.lat, location.lng]}
                eventHandlers={{
                  click: () => {
                    setSelectedLocation([location.lat, location.lng]);
                  },
                }}
              >
                <Popup>
                  <div className="max-w-xs">
                    <div className="font-semibold mb-2">
                      {location.count} {location.count === 1 ? 'memory' : 'memories'}
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {location.memories.slice(0, 5).map((memory) => (
                        <div
                          key={memory.id}
                          className="cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                          onClick={() => navigate(`/app/memories/${memory.id}`)}
                        >
                          <p className="font-medium text-sm line-clamp-1">
                            {memory.title || 'Untitled'}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {memory.body || 'No description'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(memory.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                      {location.count > 5 && (
                        <p className="text-xs text-gray-500 text-center py-1">
                          +{location.count - 5} more
                        </p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 flex-shrink-0">
        <div className="text-xs text-gray-600 text-center">
          Click markers to view memories • Clustered markers show count
        </div>
      </div>
    </div>
  );
}
