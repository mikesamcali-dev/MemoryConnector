import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { LocationSearchResult, LocationSearchResponse } from './dto/search-location.dto';

@Injectable()
export class GooglePlacesService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://places.googleapis.com/v1';

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    if (!this.apiKey) {
      console.warn('GOOGLE_PLACES_API_KEY not set in environment variables');
    }
  }

  /**
   * Search for nearby businesses using GPS coordinates
   */
  async searchNearbyBusinesses(
    latitude: number,
    longitude: number,
    radiusMeters: number = 1000,
  ): Promise<any[]> {
    try {
      const searchUrl = `${this.baseUrl}/places:searchNearby`;
      const searchBody = {
        locationRestriction: {
          circle: {
            center: { latitude, longitude },
            radius: radiusMeters,
          },
        },
        includedTypes: [
          'restaurant',
          'cafe',
          'bar',
          'store',
          'shopping_mall',
          'gas_station',
          'pharmacy',
          'bank',
          'gym',
          'hospital',
          'school',
          'library',
          'museum',
          'park',
          'movie_theater',
        ],
        maxResultCount: 20,
        languageCode: 'en',
      };

      console.log('Searching nearby businesses:', { latitude, longitude, radiusMeters });

      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.primaryTypeDisplayName,places.addressComponents,places.businessStatus',
        },
        body: JSON.stringify(searchBody),
      });

      if (!response.ok) {
        console.error('Nearby search failed:', response.statusText);
        return [];
      }

      const data = await response.json();
      const places = data.places || [];

      console.log(`Found ${places.length} nearby businesses`);

      // Transform to simplified format
      return places.map((place: any) => {
        const addr = place.addressComponents || [];
        const canonicalAddress = this.parseAddress(addr, place.formattedAddress);

        return {
          googlePlaceId: place.id,
          name: place.displayName?.text || place.formattedAddress,
          address: canonicalAddress.street,
          city: canonicalAddress.city,
          state: canonicalAddress.state,
          zip: canonicalAddress.postal_code,
          country: canonicalAddress.country,
          latitude: place.location?.latitude,
          longitude: place.location?.longitude,
          placeType: place.primaryType || place.types?.[0],
          types: place.types || [],
        };
      });
    } catch (error) {
      console.error('Error searching nearby businesses:', error);
      return [];
    }
  }

  /**
   * Search for locations using Google Places API
   */
  async searchLocation(
    inputQuery: string,
    userCountry: string = 'US',
    userRegionState?: string,
    locationBias?: { latitude: number; longitude: number; radius_meters: number },
    maxCandidates: number = 5,
  ): Promise<LocationSearchResponse> {
    const startTime = Date.now();
    const apiCallsMade: Array<{ method: string; url: string; status: number | null }> = [];

    try {
      // Step A: Normalize query
      const normalizedQuery = this.normalizeQuery(inputQuery, userCountry);

      // Step B: Call Text Search
      const searchUrl = `${this.baseUrl}/places:searchText`;
      const searchBody: any = {
        textQuery: normalizedQuery,
        languageCode: 'en',
        regionCode: userCountry,
        maxResultCount: maxCandidates,
      };

      if (locationBias) {
        searchBody.locationBias = {
          circle: {
            center: {
              latitude: locationBias.latitude,
              longitude: locationBias.longitude,
            },
            radius: locationBias.radius_meters,
          },
        };
      }

      const searchResponse = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.primaryTypeDisplayName,places.addressComponents,places.businessStatus',
        },
        body: JSON.stringify(searchBody),
      });

      apiCallsMade.push({
        method: 'POST',
        url: searchUrl,
        status: searchResponse.status,
      });

      if (!searchResponse.ok) {
        throw new HttpException(
          `Google Places API error: ${searchResponse.statusText}`,
          searchResponse.status,
        );
      }

      const searchData = await searchResponse.json();
      const places = searchData.places || [];

      if (places.length === 0) {
        return this.buildEmptyResponse(
          inputQuery,
          normalizedQuery,
          startTime,
          apiCallsMade,
          'No locations found. Try adding city/state or using a full address.',
        );
      }

      // Step C: Get details for top candidates (up to 3)
      const results: LocationSearchResult[] = [];
      const topCandidates = places.slice(0, Math.min(3, places.length));

      for (const place of topCandidates) {
        const placeId = place.id;
        const detailsUrl = `${this.baseUrl}/${placeId}`;

        const detailsResponse = await fetch(detailsUrl, {
          method: 'GET',
          headers: {
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,addressComponents,location,nationalPhoneNumber,internationalPhoneNumber,websiteUri,regularOpeningHours,types,primaryType,primaryTypeDisplayName,businessStatus',
          },
        });

        apiCallsMade.push({
          method: 'GET',
          url: detailsUrl,
          status: detailsResponse.status,
        });

        let details = place;
        if (detailsResponse.ok) {
          details = await detailsResponse.json();
        }

        // Build result
        const result = this.buildResult(details, inputQuery, userRegionState);
        results.push(result);
      }

      // Add remaining places without details
      for (let i = 3; i < places.length; i++) {
        const result = this.buildResult(places[i], inputQuery, userRegionState);
        results.push(result);
      }

      // Sort by confidence score
      results.sort((a, b) => b.confidence_score - a.confidence_score);

      return {
        input_query: inputQuery,
        normalized_query: normalizedQuery,
        results,
        metadata: {
          request_timestamp: new Date().toISOString(),
          runtime_ms: Date.now() - startTime,
          api_calls_made: apiCallsMade,
        },
        error: null,
      };
    } catch (error) {
      console.error('Google Places search error:', error);
      return {
        input_query: inputQuery,
        normalized_query: inputQuery,
        results: [],
        metadata: {
          request_timestamp: new Date().toISOString(),
          runtime_ms: Date.now() - startTime,
          api_calls_made: apiCallsMade,
        },
        error: {
          message: error.message || 'Location search failed',
          type: 'SEARCH_ERROR',
          http_status: error.status || 500,
        },
      };
    }
  }

  /**
   * Normalize the input query
   */
  private normalizeQuery(query: string, country: string): string {
    let normalized = query.trim().replace(/\s+/g, ' ');

    // Expand common abbreviations
    const abbrevMap: Record<string, string> = {
      ' Rd ': ' Road ',
      ' St ': ' Street ',
      ' Ave ': ' Avenue ',
      ' Blvd ': ' Boulevard ',
      ' Dr ': ' Drive ',
      ' Ln ': ' Lane ',
      ' Ct ': ' Court ',
      ' Pkwy ': ' Parkway ',
      ' Hwy ': ' Highway ',
      ' Ste ': ' Suite ',
      ' N ': ' North ',
      ' S ': ' South ',
      ' E ': ' East ',
      ' W ': ' West ',
    };

    // Add spaces around for matching
    normalized = ` ${normalized} `;
    for (const [abbrev, full] of Object.entries(abbrevMap)) {
      const regex = new RegExp(abbrev, 'gi');
      normalized = normalized.replace(regex, full);
    }
    normalized = normalized.trim();

    return normalized;
  }

  /**
   * Build a result from Google Places response
   */
  private buildResult(
    place: any,
    inputQuery: string,
    userRegionState?: string,
  ): LocationSearchResult {
    const displayName = place.displayName?.text || place.formattedAddress || null;
    const formattedAddress = place.formattedAddress || '';
    const addressComponents = place.addressComponents || [];
    const location = place.location || {};
    const types = place.types || [];

    // Parse canonical address
    const canonicalAddress = this.parseAddress(addressComponents, formattedAddress);

    // Calculate confidence score
    const { score, matchedFields } = this.calculateConfidence(
      inputQuery,
      displayName,
      canonicalAddress,
      userRegionState,
    );

    // Extract opening hours
    const openingHours = {
      weekday_text: place.regularOpeningHours?.weekdayDescriptions || [],
      open_now: place.regularOpeningHours?.openNow || null,
    };

    return {
      place_id: place.id || null,
      name: displayName,
      canonical_address: canonicalAddress,
      latitude: location.latitude || null,
      longitude: location.longitude || null,
      phone: place.nationalPhoneNumber || place.internationalPhoneNumber || null,
      website: place.websiteUri || null,
      categories: types,
      opening_hours: openingHours,
      confidence_score: score,
      matched_fields: matchedFields,
      source_api: {
        name: 'Google Places API (New)',
        version: 'v1',
      },
      raw_api_response_snippet: null,
      suggestions: score < 0.5 ? ['Verify the address', 'Add more location details'] : [],
    };
  }

  /**
   * Parse address components into canonical address
   */
  private parseAddress(
    components: any[],
    formattedAddress: string,
  ): {
    street: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
  } {
    let street = null;
    let city = null;
    let state = null;
    let postalCode = null;
    let country = null;

    for (const component of components) {
      const types = component.types || [];
      const longName = component.longText || component.longName || '';
      const shortName = component.shortText || component.shortName || '';

      if (types.includes('street_number') || types.includes('route')) {
        street = street ? `${street} ${longName}` : longName;
      } else if (types.includes('locality') || types.includes('sublocality')) {
        city = longName;
      } else if (types.includes('administrative_area_level_1')) {
        state = shortName || longName;
      } else if (types.includes('postal_code')) {
        postalCode = longName;
      } else if (types.includes('country')) {
        country = shortName || longName;
      }
    }

    // Fallback: parse from formatted address if components not available
    if (!street && !city && formattedAddress) {
      const parts = formattedAddress.split(',').map(p => p.trim());
      if (parts.length >= 1) street = parts[0];
      if (parts.length >= 2) city = parts[1];
      if (parts.length >= 3) {
        const stateParts = parts[2].split(' ');
        state = stateParts[0];
        if (stateParts.length > 1) postalCode = stateParts[1];
      }
    }

    return { street, city, state, postal_code: postalCode, country };
  }

  /**
   * Calculate confidence score based on matching
   */
  private calculateConfidence(
    inputQuery: string,
    name: string | null,
    address: any,
    userRegionState?: string,
  ): { score: number; matchedFields: string[] } {
    let score = 0;
    const matchedFields: string[] = [];

    const queryLower = inputQuery.toLowerCase();
    const nameLower = (name || '').toLowerCase();

    // Business name match (+0.35)
    if (name && this.tokensMatch(queryLower, nameLower)) {
      score += 0.35;
      matchedFields.push('name');
    }

    // Street match (+0.30)
    const hasStreetNumber = /\b\d{1,6}\b/.test(queryLower);
    if (address.street && queryLower.includes(address.street.toLowerCase())) {
      score += 0.30;
      matchedFields.push('street');
    }

    // City match (+0.15)
    if (address.city && queryLower.includes(address.city.toLowerCase())) {
      score += 0.15;
      matchedFields.push('city');
    }

    // State match (+0.10)
    if (address.state && queryLower.includes(address.state.toLowerCase())) {
      score += 0.10;
      matchedFields.push('state');
    }

    // Postal code match (+0.10)
    if (address.postal_code && queryLower.includes(address.postal_code)) {
      score += 0.10;
      matchedFields.push('postal_code');
    }

    // Penalties
    if (userRegionState && address.state && address.state !== userRegionState) {
      score -= 0.30;
    }

    if (hasStreetNumber && !address.street) {
      score -= 0.25;
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      matchedFields,
    };
  }

  /**
   * Check if tokens match between query and name
   */
  private tokensMatch(query: string, name: string): boolean {
    const queryTokens = query.split(/\s+/).filter(t => t.length > 2);
    const nameTokens = name.split(/\s+/).filter(t => t.length > 2);

    let matches = 0;
    for (const qToken of queryTokens) {
      for (const nToken of nameTokens) {
        if (nToken.includes(qToken) || qToken.includes(nToken)) {
          matches++;
          break;
        }
      }
    }

    return matches >= Math.min(2, queryTokens.length);
  }

  /**
   * Build empty response with suggestions
   */
  private buildEmptyResponse(
    inputQuery: string,
    normalizedQuery: string,
    startTime: number,
    apiCallsMade: any[],
    message: string,
  ): LocationSearchResponse {
    return {
      input_query: inputQuery,
      normalized_query: normalizedQuery,
      results: [],
      metadata: {
        request_timestamp: new Date().toISOString(),
        runtime_ms: Date.now() - startTime,
        api_calls_made: apiCallsMade,
      },
      error: {
        message,
        type: 'NO_RESULTS',
        http_status: 404,
      },
    };
  }
}
