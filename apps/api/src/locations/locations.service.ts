import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GooglePlacesService } from './google-places.service';
import OpenAI from 'openai';

@Injectable()
export class LocationsService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private googlePlacesService: GooglePlacesService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Create a standalone location (without linking to a memory)
   */
  async create(
    name: string,
    latitude?: number,
    longitude?: number,
    address?: string,
    city?: string,
    state?: string,
    zip?: string,
    country?: string,
    locationType?: string,
    placeType?: string,
  ): Promise<any> {
    const normalizedName = name.trim();

    // Check if location with same name and coordinates already exists
    if (latitude && longitude) {
      const existing = await this.findNearby(latitude, longitude);
      const match = existing.find(loc =>
        loc.name?.toLowerCase() === normalizedName.toLowerCase()
      );

      if (match) {
        console.log('Found existing location:', match.id);
        return match;
      }
    }

    // Create new location
    console.log('Creating new location:', normalizedName);

    // Only enrich if no data provided
    let enrichedData = null;
    if (!address && !city && !state && !zip && !country && !locationType && !placeType && !latitude && !longitude) {
      enrichedData = await this.enrichLocationWithOpenAI(normalizedName);
    }

    const location = await this.prisma.location.create({
      data: {
        name: normalizedName,
        address: address ?? enrichedData?.address ?? null,
        city: city ?? enrichedData?.city ?? null,
        state: state ?? enrichedData?.state ?? null,
        zip: zip ?? null,
        country: country ?? enrichedData?.country ?? null,
        locationType: locationType ?? null,
        latitude: latitude ?? enrichedData?.latitude ?? null,
        longitude: longitude ?? enrichedData?.longitude ?? null,
        placeType: placeType ?? enrichedData?.placeType ?? null,
        lastEnrichedAt: enrichedData ? new Date() : null,
      },
    });

    console.log('Location created:', location.id);
    return location;
  }

  /**
   * Create or find location and link to memory
   */
  async createOrLinkLocation(memoryId: string, locationName: string, latitude?: number, longitude?: number): Promise<any> {
    const normalizedName = locationName.trim();

    // Check if location with same name and coordinates already exists
    if (latitude && longitude) {
      const existing = await this.findNearby(latitude, longitude);
      const match = existing.find(loc =>
        loc.name?.toLowerCase() === normalizedName.toLowerCase()
      );

      if (match) {
        // Link existing location to memory
        await this.prisma.memory.update({
          where: { id: memoryId },
          data: { locationId: match.id },
        });
        return match;
      }
    }

    // Create new location
    console.log('Creating new location:', normalizedName);
    const enrichedData = await this.enrichLocationWithOpenAI(normalizedName);

    const finalLatitude = latitude ?? enrichedData.latitude;
    const finalLongitude = longitude ?? enrichedData.longitude;

    const location = await this.prisma.location.create({
      data: {
        name: normalizedName,
        address: enrichedData.address,
        city: enrichedData.city,
        state: enrichedData.state,
        country: enrichedData.country,
        latitude: finalLatitude,
        longitude: finalLongitude,
        placeType: enrichedData.placeType,
        lastEnrichedAt: new Date(),
      },
    });

    // Link to memory
    await this.prisma.memory.update({
      where: { id: memoryId },
      data: { locationId: location.id },
    });

    console.log('Location created:', location.id);
    return location;
  }

  /**
   * Find locations within a specified radius of given coordinates
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @param radiusMeters - Optional radius in meters (default: 100 feet / ~30 meters)
   */
  async findNearby(latitude: number, longitude: number, radiusMeters: number = 30): Promise<any[]> {
    // Convert meters to degrees (approximately, at mid-latitudes)
    // 1 degree latitude ≈ 111,000 meters
    const delta = radiusMeters / 111000;
    const minLat = latitude - delta;
    const maxLat = latitude + delta;
    const minLng = longitude - delta;
    const maxLng = longitude + delta;

    console.log('Finding nearby locations:', {
      searchCoords: { latitude, longitude },
      radiusMeters,
      delta,
      bounds: { minLat, maxLat, minLng, maxLng },
    });

    const locations = await this.prisma.location.findMany({
      where: {
        AND: [
          { latitude: { not: null, gte: minLat, lte: maxLat } },
          { longitude: { not: null, gte: minLng, lte: maxLng } },
        ],
      },
    });

    console.log('Found nearby locations:', locations.length);
    return locations;
  }

  /**
   * Get all locations
   */
  async findAll(): Promise<any[]> {
    return this.prisma.location.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get user's most recent locations (for quick selection)
   */
  async getUserRecentLocations(userId: string, limit: number = 10): Promise<any[]> {
    console.log('getUserRecentLocations called for userId:', userId, 'limit:', limit);

    const locations = await this.prisma.location.findMany({
      where: {
        memories: {
          some: {
            userId: userId,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
      distinct: ['id'],
    });

    console.log('getUserRecentLocations found', locations.length, 'locations:',
      locations.map(l => ({ id: l.id, name: l.name, updatedAt: l.updatedAt })));

    return locations;
  }

  /**
   * Get location by ID
   */
  async findById(id: string): Promise<any> {
    const location = await this.prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    }

    return location;
  }

  /**
   * Discover nearby businesses and filter out existing locations
   */
  async discoverNearbyBusinesses(
    latitude: number,
    longitude: number,
    radiusMeters: number = 1000,
  ): Promise<{ new: any[]; existing: any[] }> {
    // Search Google Places for nearby businesses
    const nearbyPlaces = await this.googlePlacesService.searchNearbyBusinesses(
      latitude,
      longitude,
      radiusMeters,
    );

    console.log('Discovering nearby businesses:', {
      latitude,
      longitude,
      radiusMeters,
      foundPlaces: nearbyPlaces.length,
    });

    if (nearbyPlaces.length === 0) {
      return { new: [], existing: [] };
    }

    // Get existing locations within radius to check for duplicates
    const existingLocations = await this.findNearby(latitude, longitude, radiusMeters);

    const newLocations: any[] = [];
    const existingMatches: any[] = [];

    for (const place of nearbyPlaces) {
      // Check if location already exists by name and proximity
      const isDuplicate = existingLocations.some(existing => {
        const nameMatch = existing.name?.toLowerCase() === place.name?.toLowerCase();

        // Check if coordinates are very close (within ~100 feet)
        if (existing.latitude && existing.longitude && place.latitude && place.longitude) {
          const latDiff = Math.abs(existing.latitude - place.latitude);
          const lngDiff = Math.abs(existing.longitude - place.longitude);
          const isNearby = latDiff < 0.0003 && lngDiff < 0.0003;

          return nameMatch || isNearby;
        }

        return nameMatch;
      });

      if (isDuplicate) {
        existingMatches.push(place);
      } else {
        newLocations.push(place);
      }
    }

    console.log(`Found ${newLocations.length} new locations and ${existingMatches.length} existing`);

    return {
      new: newLocations,
      existing: existingMatches,
    };
  }

  /**
   * Batch create locations from nearby discovery
   */
  async batchCreateLocations(userId: string, locations: any[]): Promise<any[]> {
    const created: any[] = [];

    for (const loc of locations) {
      try {
        const location = await this.create(
          loc.name,
          loc.latitude,
          loc.longitude,
          loc.address,
          loc.city,
          loc.state,
          loc.zip,
          loc.country,
          null, // locationType
          loc.placeType,
        );
        created.push(location);
      } catch (error) {
        console.error(`Failed to create location ${loc.name}:`, error.message);
      }
    }

    console.log(`Batch created ${created.length} of ${locations.length} locations`);
    return created;
  }

  /**
   * Get memories linked to a location
   */
  async getMemoriesForLocation(id: string): Promise<any[]> {
    const location = await this.prisma.location.findUnique({
      where: { id },
      include: {
        memories: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });

    if (!location) {
      throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    }

    return location.memories;
  }

  /**
   * Re-enrich location with OpenAI (admin only)
   */
  async enrichLocation(id: string): Promise<any> {
    const location = await this.prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    }

    console.log('Re-enriching location with OpenAI:', location.name);
    const enrichedData = await this.enrichLocationWithOpenAI(location.name);

    const updatedLocation = await this.prisma.location.update({
      where: { id },
      data: {
        address: enrichedData.address,
        city: enrichedData.city,
        state: enrichedData.state,
        country: enrichedData.country,
        latitude: enrichedData.latitude ?? location.latitude,
        longitude: enrichedData.longitude ?? location.longitude,
        placeType: enrichedData.placeType,
        lastEnrichedAt: new Date(),
      },
    });

    console.log('Location enriched:', updatedLocation.id);
    return updatedLocation;
  }

  /**
   * Preview enrichment without creating location
   */
  async previewEnrichment(address: string): Promise<any> {
    return this.enrichLocationWithOpenAI(address);
  }

  /**
   * Enrich location with OpenAI
   */
  private async enrichLocationWithOpenAI(locationName: string): Promise<any> {
    try {
      const prompt = `Provide detailed information about the location "${locationName}" in JSON format with the following fields:
- address: Full street address if applicable, or null
- city: City name, or null if not applicable
- state: State/province name, or null if not applicable
- country: Country name, or null if not applicable
- latitude: Latitude coordinate as a number, or null if unknown
- longitude: Longitude coordinate as a number, or null if unknown
- placeType: Type of place (e.g., "restaurant", "park", "building", "city", "country", "landmark"), or null

Return ONLY valid JSON, no additional text.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides information about locations and places. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error('No response from OpenAI for location enrichment');
        return this.getDefaultLocationData();
      }

      const locationData = JSON.parse(content);

      return {
        address: locationData.address || null,
        city: locationData.city || null,
        state: locationData.state || null,
        country: locationData.country || null,
        latitude: locationData.latitude || null,
        longitude: locationData.longitude || null,
        placeType: locationData.placeType || null,
      };
    } catch (error) {
      console.error('Error enriching location with OpenAI:', error);
      return this.getDefaultLocationData();
    }
  }

  /**
   * Update a location
   */
  async updateLocation(id: string, updateData: any): Promise<any> {
    const location = await this.prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    }

    const updatedLocation = await this.prisma.location.update({
      where: { id },
      data: {
        ...(updateData.name !== undefined && { name: updateData.name }),
        ...(updateData.latitude !== undefined && { latitude: updateData.latitude }),
        ...(updateData.longitude !== undefined && { longitude: updateData.longitude }),
        ...(updateData.address !== undefined && { address: updateData.address }),
        ...(updateData.city !== undefined && { city: updateData.city }),
        ...(updateData.state !== undefined && { state: updateData.state }),
        ...(updateData.zip !== undefined && { zip: updateData.zip }),
        ...(updateData.country !== undefined && { country: updateData.country }),
        ...(updateData.locationType !== undefined && { locationType: updateData.locationType }),
        ...(updateData.placeType !== undefined && { placeType: updateData.placeType }),
      },
    });

    console.log('Location updated:', updatedLocation.id);
    return updatedLocation;
  }

  /**
   * Delete a location
   */
  async deleteLocation(id: string): Promise<void> {
    const location = await this.prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.location.delete({
      where: { id },
    });

    console.log('Location deleted:', id);
  }

  private getDefaultLocationData() {
    return {
      address: null,
      city: null,
      state: null,
      country: null,
      latitude: null,
      longitude: null,
      placeType: null,
    };
  }
}
