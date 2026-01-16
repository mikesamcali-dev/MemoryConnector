import { useState } from 'react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { getAllLocationsForUser, createLocation, updateLocation, deleteLocation } from '../api/admin';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { ArrowLeft, MapPin, Plus, Search, Edit, Trash2, ExternalLink, FileText, Sparkles } from 'lucide-react';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { useNavigate } from 'react-router-dom';
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
import { AutoLocationModal } from '../components/AutoLocationModal';

import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
export function LocationBuilderPage() {
    const helpPopup = useHelpPopup('locations');
const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAutoLocationModal, setShowAutoLocationModal] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [zip, setZip] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [locationType, setLocationType] = useState<string>('');
  const [placeType, setPlaceType] = useState<string>('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Fetch all locations
  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: getAllLocationsForUser,
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: ({
      name,
      lat,
      lng,
      address,
      city,
      state,
      zip,
      country,
      locationType,
      placeType
    }: {
      name: string;
      lat?: number;
      lng?: number;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
      locationType?: string;
      placeType?: string;
    }) => {
      return createLocation(name, lat, lng, address, city, state, zip, country, locationType, placeType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setShowCreateForm(false);
      setNewLocationName('');
      setLatitude('');
      setLongitude('');
      setAddress('');
      setCity('');
      setState('');
      setZip('');
      setCountry('');
      setLocationType('');
      setPlaceType('');
      setSearchQuery('');
      setSearchResults([]);
    },
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setEditingLocationId(null);
      setNewLocationName('');
      setLatitude('');
      setLongitude('');
      setAddress('');
      setCity('');
      setState('');
      setZip('');
      setCountry('');
      setLocationType('');
      setPlaceType('');
      setSearchQuery('');
      setSearchResults([]);
    },
  });

  // Delete location mutation with optimistic update
  const deleteLocationMutation = useMutation({
    mutationFn: (id: string) => deleteLocation(id),
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['locations'] });

      // Snapshot previous value
      const previousLocations = queryClient.getQueryData(['locations']);

      // Optimistically remove from cache
      queryClient.setQueryData(['locations'], (old: any[] | undefined) =>
        old?.filter(loc => loc.id !== deletedId) ?? []
      );

      return { previousLocations };
    },
    onError: (_err, _deletedId, context: any) => {
      // Rollback on error
      queryClient.setQueryData(['locations'], context?.previousLocations);
    },
    onSettled: () => {
      // Always refetch after success or error
      queryClient.invalidateQueries({ queryKey: ['locations'] });
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

  // Search for locations using Google Places API
  const searchLocations = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search query');
      return;
    }

    setSearching(true);
    setSearchResults([]);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/locations/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          input_query: searchQuery.trim(),
          user_country: 'US',
          user_region_state: 'MI',
          max_candidates: 10,
        }),
      });

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();
      console.log('Google Places search response:', data);
      console.log('Found', data.results?.length || 0, 'locations');

      if (!data.results || data.results.length === 0) {
        const errorMsg = data.error?.message || 'No locations found';
        alert(`${errorMsg}\n\nTry:\n` +
              '- Using full address: "44777 mound rd sterling heights mi"\n' +
              '- Business name with city: "la fitness sterling heights"\n' +
              '- Just street and city: "mound rd sterling heights"');
        setSearching(false);
        return;
      }

      // Transform Google Places results to match our UI format
      const transformedResults = data.results.map((result: any) => ({
        place_id: result.place_id,
        name: result.name,
        display_name: result.name,
        lat: result.latitude,
        lon: result.longitude,
        address: {
          road: result.canonical_address.street,
          city: result.canonical_address.city,
          state: result.canonical_address.state,
          postcode: result.canonical_address.postal_code,
          country: result.canonical_address.country,
          amenity: result.categories[0],
        },
        class: result.categories[0],
        type: result.categories[1] || result.categories[0],
        confidence_score: result.confidence_score,
        phone: result.phone,
        website: result.website,
      }));

      setSearchResults(transformedResults);
      setSearching(false);
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search locations. Please try again.');
      setSearching(false);
    }
  };

  // Fill form with selected search result
  const selectSearchResult = (result: any) => {
    const addr = result.address || {};

    // Set location name - prioritize specific names over generic ones
    let placeName = '';
    if (result.name && result.name.trim()) {
      placeName = result.name;
    } else if (addr.amenity) {
      placeName = addr.amenity;
    } else if (addr.building && addr.building !== 'yes') {
      placeName = addr.building;
    } else if (addr.tourism) {
      placeName = addr.tourism;
    } else if (addr.shop) {
      placeName = addr.shop;
    } else if (addr.road) {
      placeName = addr.road;
    } else {
      // Fall back to first part of display name
      placeName = result.display_name.split(',')[0].trim();
    }
    setNewLocationName(placeName);

    // Set address components
    const streetNumber = addr.house_number || '';
    const street = addr.road || '';
    const addressLine = [streetNumber, street].filter(Boolean).join(' ');
    setAddress(addressLine);

    setCity(addr.city || addr.town || addr.village || addr.hamlet || '');
    setState(addr.state || addr.county || '');
    setZip(addr.postcode || '');
    setCountry(addr.country || '');

    // Set coordinates
    setLatitude(result.lat);
    setLongitude(result.lon);

    // Determine location type based on OSM data
    let detectedType = '';

    // Check amenity field first
    if (addr.amenity) {
      const amenityMap: Record<string, string> = {
        'restaurant': 'restaurant',
        'cafe': 'restaurant',
        'fast_food': 'restaurant',
        'food_court': 'restaurant',
        'bar': 'restaurant',
        'pub': 'restaurant',
        'biergarten': 'restaurant',
        'hospital': 'medical',
        'clinic': 'medical',
        'doctors': 'medical',
        'dentist': 'medical',
        'pharmacy': 'medical',
        'veterinary': 'medical',
        'school': 'education',
        'college': 'education',
        'university': 'education',
        'kindergarten': 'education',
        'library': 'education',
        'bank': 'business',
        'atm': 'business',
        'post_office': 'business',
        'courthouse': 'business',
        'townhall': 'business',
        'community_centre': 'business',
        'parking': 'transportation',
        'parking_space': 'transportation',
        'fuel': 'transportation',
        'charging_station': 'transportation',
        'bus_station': 'transportation',
        'taxi': 'transportation',
        'car_rental': 'transportation',
        'bicycle_rental': 'transportation',
        'place_of_worship': 'religious',
        'monastery': 'religious',
        'cinema': 'entertainment',
        'theatre': 'entertainment',
        'nightclub': 'entertainment',
        'arts_centre': 'entertainment',
        'casino': 'entertainment',
        'community_center': 'entertainment',
        'park': 'recreation',
        'playground': 'recreation',
        'sports_centre': 'recreation',
        'stadium': 'recreation',
        'swimming_pool': 'recreation',
        'gym': 'recreation',
        'fitness_centre': 'recreation',
      };
      detectedType = amenityMap[addr.amenity] || '';
    }

    // Check shop field
    if (!detectedType && addr.shop) {
      const shopMap: Record<string, string> = {
        'supermarket': 'shopping',
        'convenience': 'shopping',
        'clothes': 'shopping',
        'mall': 'shopping',
        'department_store': 'shopping',
        'general': 'shopping',
        'books': 'shopping',
        'gift': 'shopping',
        'furniture': 'shopping',
        'electronics': 'shopping',
        'bakery': 'restaurant',
        'butcher': 'shopping',
        'florist': 'shopping',
      };
      detectedType = shopMap[addr.shop] || 'shopping';
    }

    // Check tourism field
    if (!detectedType && addr.tourism) {
      const tourismMap: Record<string, string> = {
        'hotel': 'hotel',
        'motel': 'hotel',
        'hostel': 'hotel',
        'guest_house': 'hotel',
        'apartment': 'hotel',
        'museum': 'tourism',
        'gallery': 'tourism',
        'attraction': 'tourism',
        'viewpoint': 'tourism',
        'zoo': 'tourism',
        'theme_park': 'tourism',
        'aquarium': 'tourism',
      };
      detectedType = tourismMap[addr.tourism] || 'tourism';
    }

    // Check leisure field
    if (!detectedType && addr.leisure) {
      const leisureMap: Record<string, string> = {
        'park': 'recreation',
        'garden': 'recreation',
        'playground': 'recreation',
        'sports_centre': 'recreation',
        'stadium': 'recreation',
        'swimming_pool': 'recreation',
        'golf_course': 'recreation',
        'fitness_centre': 'recreation',
      };
      detectedType = leisureMap[addr.leisure] || 'recreation';
    }

    // Check office field
    if (!detectedType && addr.office) {
      detectedType = 'business';
    }

    // Check for islands
    if (!detectedType && (addr.place === 'island' || result.type === 'island')) {
      detectedType = 'island';
    }

    // Check result.type and result.class for additional hints
    if (!detectedType && result.type) {
      const typeMap: Record<string, string> = {
        'attraction': 'tourism',
        'building': 'other',
        'residential': 'home',
        'hotel': 'hotel',
        'restaurant': 'restaurant',
        'park': 'recreation',
        'shop': 'shopping',
        'island': 'island',
        'islet': 'island',
      };
      detectedType = typeMap[result.type] || '';
    }

    // Also check result.class for geographical features
    if (!detectedType && result.class === 'place' && result.type === 'island') {
      detectedType = 'island';
    }

    // Check if "island" or "isle" is in the name
    if (!detectedType && (placeName.toLowerCase().includes('island') || placeName.toLowerCase().includes('isle'))) {
      detectedType = 'island';
    }

    // Only set if we detected a valid type
    if (detectedType) {
      setLocationType(detectedType);
    }


    // Determine specific place type
    const specificType = addr.amenity || addr.shop || addr.tourism || addr.leisure || addr.office || '';
    setPlaceType(specificType);

    // Clear search results
    setSearchResults([]);
    setSearchQuery('');
  };

  // Geocode address to get lat/long
  const geocodeAddress = async () => {
    // Build address string from components
    const addressParts = [address, city, state, zip, country].filter(Boolean);
    if (addressParts.length === 0) {
      alert('Please enter at least one address component');
      return;
    }

    const fullAddress = addressParts.join(', ');
    setGeocoding(true);

    try {
      // Using OpenStreetMap Nominatim API (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress)}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'MemoryConnector/1.0' // Nominatim requires a User-Agent
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const results = await response.json();

      if (results.length === 0) {
        alert('Address not found. Please check the address and try again.');
        setGeocoding(false);
        return;
      }

      const result = results[0];
      setLatitude(result.lat);
      setLongitude(result.lon);
      setGeocoding(false);
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Failed to geocode address. Please try again or enter coordinates manually.');
      setGeocoding(false);
    }
  };

  // Filter locations based on search
  const filteredLocations = locations?.filter((loc) =>
    loc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.address?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCreateLocation = () => {
    if (!newLocationName.trim()) return;

    const lat = latitude ? parseFloat(latitude) : undefined;
    const lng = longitude ? parseFloat(longitude) : undefined;

    createLocationMutation.mutate({
      name: newLocationName.trim(),
      lat,
      lng,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      zip: zip || undefined,
      country: country || undefined,
      locationType: locationType || undefined,
      placeType: placeType || undefined,
    });
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
          <MapPin className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Location Builder</h1>
        </div>
        <p className="text-gray-600">
          Create and manage locations for your memories
        </p>
      </div>

      {/* Create Location Buttons */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          {showCreateForm ? 'Cancel' : 'Create New Location'}
        </button>
        <button
          onClick={() => setShowAutoLocationModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          <Sparkles className="h-4 w-4" />
          Auto-Discover Nearby
        </button>
      </div>

      {/* Create Location Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Location</h2>

          <div className="space-y-4">
            {/* Location Search */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Search for a Location
              </label>
              <p className="text-xs text-blue-700 mb-3">
                Powered by Google Places. Search by business name, address, or combine (e.g., "la fitness mound sterling heights mi")
              </p>

              {/* General Search */}
              <div className="mb-3">
                <label htmlFor="locationSearch" className="block text-xs font-medium text-gray-700 mb-1">
                  General Search
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="locationSearch"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchLocations()}
                      placeholder="e.g., la fitness mound sterling heights, Starbucks Detroit, 123 Main St..."
                      className="w-full pl-10 pr-4 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={searchLocations}
                disabled={searching || !searchQuery.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-3 max-h-80 overflow-y-auto border border-blue-200 rounded-md bg-white shadow-sm">
                  {searchResults.map((result, index) => {
                    const addr = result.address || {};
                    const isBusiness = result.class === 'amenity' || result.class === 'shop' || result.class === 'tourism';
                    const businessType = addr.amenity || addr.shop || addr.tourism || result.type;

                    return (
                      <button
                        key={index}
                        onClick={() => selectSearchResult(result)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          {isBusiness && (
                            <span className="text-lg mt-0.5">🏢</span>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {result.name || result.display_name.split(',')[0]}
                            </div>
                            <div className="text-sm text-gray-600 mt-0.5">
                              {[addr.road, addr.city, addr.state, addr.country]
                                .filter(Boolean)
                                .slice(0, 3)
                                .join(', ')}
                            </div>
                            {businessType && (
                              <div className="flex gap-2 mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {businessType.replace(/_/g, ' ')}
                                </span>
                                {result.class && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                    {result.class}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600 mb-3">Or enter details manually:</p>
            </div>

            <div>
              <label htmlFor="locationName" className="block text-sm font-medium text-gray-700 mb-2">
                Location Name *
              </label>
              <input
                type="text"
                id="locationName"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="e.g., Home, Office, Coffee Shop"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 123 Main St"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., San Francisco"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g., CA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-2">
                  Zip Code
                </label>
                <input
                  type="text"
                  id="zip"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="e.g., 94102"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g., USA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Coordinates</h3>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="text"
                    id="latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g., 37.7749"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="text"
                    id="longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g., -122.4194"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={geocodeAddress}
                  disabled={geocoding || (!address && !city && !state && !zip)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Get coordinates from address"
                >
                  <MapPin className="h-4 w-4" />
                  {geocoding ? 'Getting coordinates...' : 'Get Coordinates from Address'}
                </button>

                <button
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  <MapPin className="h-4 w-4" />
                  {gettingLocation ? 'Getting location...' : 'Use Current GPS Location'}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCreateLocation}
                disabled={!newLocationName.trim() || createLocationMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createLocationMutation.isPending ? 'Creating...' : 'Create Location'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewLocationName('');
                  setLatitude('');
                  setLongitude('');
                  setAddress('');
                  setCity('');
                  setState('');
                  setZip('');
                  setCountry('');
                  setLocationType('');
                  setPlaceType('');
                  setSearchQuery('');
                  setSearchResults([]);
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
            placeholder="Search locations..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Locations List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            All Locations ({filteredLocations.length})
          </h2>

          {isLoading ? (
            <div className="text-center py-8 text-gray-600">Loading locations...</div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? `No locations found matching "${searchTerm}"` : 'No locations yet. Create your first location above!'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLocations.map((location) => (
                <div key={location.id}>
                  {editingLocationId === location.id ? (
                    // Edit Form
                    <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Edit Location</h3>
                        {latitude && longitude && (
                          <a
                            href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                            title="View on Google Maps"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="space-y-3">
                        {/* Location Search in Edit Form */}
                        <div className="bg-white border border-blue-300 rounded-lg p-3">
                          <label className="block text-xs font-medium text-blue-900 mb-2">
                            Search to Update Location
                          </label>
                          <div className="flex gap-2">
                            <div className="flex-1 relative">
                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && searchLocations()}
                                placeholder="Search for location..."
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <button
                              onClick={searchLocations}
                              disabled={searching || !searchQuery.trim()}
                              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                              {searching ? 'Searching...' : 'Search'}
                            </button>
                          </div>

                          {/* Search Results in Edit Form */}
                          {searchResults.length > 0 && (
                            <div className="mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-sm">
                              {searchResults.map((result, index) => {
                                const addr = result.address || {};
                                const isBusiness = result.class === 'amenity' || result.class === 'shop' || result.class === 'tourism';
                                const businessType = addr.amenity || addr.shop || addr.tourism || result.type;

                                return (
                                  <button
                                    key={index}
                                    onClick={() => selectSearchResult(result)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="flex items-start gap-2">
                                      {isBusiness && (
                                        <span className="text-base">🏢</span>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 truncate">
                                          {result.name || result.display_name.split(',')[0]}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-0.5">
                                          {[addr.road, addr.city, addr.state]
                                            .filter(Boolean)
                                            .slice(0, 2)
                                            .join(', ')}
                                        </div>
                                        {businessType && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                            {businessType.replace(/_/g, ' ')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location Name *
                          </label>
                          <input
                            type="text"
                            value={newLocationName}
                            onChange={(e) => setNewLocationName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                          </label>
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Street address"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              City
                            </label>
                            <input
                              type="text"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="City"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              State/Province
                            </label>
                            <input
                              type="text"
                              value={state}
                              onChange={(e) => setState(e.target.value)}
                              placeholder="State or Province"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Zip Code
                            </label>
                            <input
                              type="text"
                              value={zip}
                              onChange={(e) => setZip(e.target.value)}
                              placeholder="Zip Code"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Country
                            </label>
                            <input
                              type="text"
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                              placeholder="Country"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Place Type
                          </label>
                          <input
                            type="text"
                            value={placeType}
                            onChange={(e) => setPlaceType(e.target.value)}
                            placeholder="e.g., Restaurant, Park"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div className="border-t border-gray-200 pt-3">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Latitude
                              </label>
                              <input
                                type="text"
                                value={latitude || 'Not set'}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Longitude
                              </label>
                              <input
                                type="text"
                                value={longitude || 'Not set'}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                              />
                            </div>
                          </div>

                          <button
                            onClick={geocodeAddress}
                            disabled={geocoding || (!address && !city && !state && !zip)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                            title="Get coordinates from address"
                          >
                            <MapPin className="h-4 w-4" />
                            {geocoding ? 'Getting coordinates...' : 'Get Coordinates from Address'}
                          </button>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => {
                              updateLocationMutation.mutate({
                                id: location.id,
                                data: {
                                  name: newLocationName,
                                  address: address || undefined,
                                  city: city || undefined,
                                  state: state || undefined,
                                  zip: zip || undefined,
                                  country: country || undefined,
                                  locationType: locationType || undefined,
                                  placeType: placeType || undefined,
                                },
                              });
                            }}
                            disabled={!newLocationName.trim() || updateLocationMutation.isPending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {updateLocationMutation.isPending ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingLocationId(null);
                              setNewLocationName('');
                              setLatitude('');
                              setLongitude('');
                              setAddress('');
                              setCity('');
                              setState('');
                              setZip('');
                              setCountry('');
                              setLocationType('');
                              setPlaceType('');
                              setSearchQuery('');
                              setSearchResults([]);
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
                    <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-start gap-3 flex-1">
                        <MapPin className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 mb-1">
                            {location.name}
                          </div>
                          {location.address && (
                            <div className="text-sm text-gray-600 mb-1">
                              {location.address}
                            </div>
                          )}
                          {(location.city || location.state || location.country) && (
                            <div className="text-sm text-gray-500">
                              {[location.city, location.state, location.country]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          )}
                          {location.placeType && (
                            <div className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {location.placeType}
                            </div>
                          )}
                          {location.latitude && location.longitude && (
                            <div className="text-xs text-gray-400 mt-1">
                              📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => navigate(`/app/locations/${location.id}/memories`)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                          title="View memories for this location"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingLocationId(location.id);
                            setNewLocationName(location.name);
                            setLatitude(location.latitude?.toString() || '');
                            setLongitude(location.longitude?.toString() || '');
                            setAddress(location.address || '');
                            setCity(location.city || '');
                            setState(location.state || '');
                            setZip(location.zip || '');
                            setCountry(location.country || '');
                            setLocationType(location.locationType || '');
                            setPlaceType(location.placeType || '');
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit location"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${location.name}"?`)) {
                              deleteLocationMutation.mutate(location.id);
                            }
                          }}
                          disabled={deleteLocationMutation.isPending}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Delete location"
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

      {/* Auto Location Discovery Modal */}
      <AutoLocationModal
        isOpen={showAutoLocationModal}
        onClose={() => setShowAutoLocationModal(false)}
      />
      {/* Help Popup */}
      <HelpPopup
        pageKey="locations"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />

    </div>
  );
}