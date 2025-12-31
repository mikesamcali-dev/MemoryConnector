import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { GooglePlacesService } from './google-places.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { SearchLocationDto } from './dto/search-location.dto';
import { DiscoverNearbyDto } from './dto/discover-nearby.dto';
import { BatchCreateLocationsDto } from './dto/batch-create.dto';

@ApiTags('locations')
@Controller('locations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,
    private readonly googlePlacesService: GooglePlacesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new location' })
  async create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationsService.create(
      createLocationDto.name,
      createLocationDto.latitude,
      createLocationDto.longitude,
      createLocationDto.address,
      createLocationDto.city,
      createLocationDto.state,
      createLocationDto.zip,
      createLocationDto.country,
      createLocationDto.locationType,
      createLocationDto.placeType,
    );
  }

  @Post('search')
  @ApiOperation({ summary: 'Search for locations using Google Places API' })
  async search(@Body() searchDto: SearchLocationDto) {
    const locationBias = searchDto.bias_latitude && searchDto.bias_longitude
      ? {
          latitude: searchDto.bias_latitude,
          longitude: searchDto.bias_longitude,
          radius_meters: searchDto.bias_radius_meters || 5000,
        }
      : undefined;

    return this.googlePlacesService.searchLocation(
      searchDto.input_query,
      searchDto.user_country || 'US',
      searchDto.user_region_state,
      locationBias,
      searchDto.max_candidates || 5,
    );
  }

  @Post('discover-nearby')
  @ApiOperation({ summary: 'Discover nearby businesses using GPS coordinates' })
  async discoverNearby(@Body() discoverDto: DiscoverNearbyDto) {
    return this.locationsService.discoverNearbyBusinesses(
      discoverDto.latitude,
      discoverDto.longitude,
      discoverDto.radiusMeters || 1000,
    );
  }

  @Post('batch-create')
  @ApiOperation({ summary: 'Batch create multiple locations' })
  async batchCreate(
    @User() user: any,
    @Body() batchDto: BatchCreateLocationsDto,
  ) {
    return this.locationsService.batchCreateLocations(user.id, batchDto.locations);
  }

  @Get()
  @ApiOperation({ summary: 'Get all locations' })
  async findAll() {
    return this.locationsService.findAll();
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get user\'s recent locations' })
  async getRecentLocations(@User() user: any, @Query('limit') limit?: string) {
    const maxLocations = limit ? parseInt(limit) : 10;
    return this.locationsService.getUserRecentLocations(user.id, maxLocations);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find locations near given coordinates' })
  async findNearby(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radiusMeters') radiusMeters?: string,
  ) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = radiusMeters ? parseFloat(radiusMeters) : undefined;
    return this.locationsService.findNearby(lat, lng, radius);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location by ID' })
  async findOne(@Param('id') id: string) {
    return this.locationsService.findById(id);
  }

  @Get(':id/memories')
  @ApiOperation({ summary: 'Get memories linked to this location' })
  async getMemories(@Param('id') id: string) {
    return this.locationsService.getMemoriesForLocation(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a location' })
  async update(@Param('id') id: string, @Body() updateLocationDto: UpdateLocationDto) {
    return this.locationsService.updateLocation(id, updateLocationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a location' })
  async delete(@Param('id') id: string) {
    return this.locationsService.deleteLocation(id);
  }

  @Post(':id/enrich')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Re-enrich location with OpenAI (admin only)' })
  async enrich(@Param('id') id: string) {
    return this.locationsService.enrichLocation(id);
  }
}
