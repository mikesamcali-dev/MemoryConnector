import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PeopleService } from './people.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

@ApiTags('people')
@Controller('people')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new person' })
  async create(@Body() createPersonDto: CreatePersonDto) {
    return this.peopleService.create(
      createPersonDto.displayName,
      createPersonDto.email,
      createPersonDto.phone,
      createPersonDto.bio,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all people' })
  async findAll() {
    return this.peopleService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search people by name' })
  async search(@Query('q') query: string) {
    return this.peopleService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get person by ID' })
  async findOne(@Param('id') id: string) {
    return this.peopleService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a person' })
  async update(@Param('id') id: string, @Body() updatePersonDto: UpdatePersonDto) {
    return this.peopleService.updatePerson(id, updatePersonDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a person' })
  async delete(@Param('id') id: string) {
    return this.peopleService.deletePerson(id);
  }

  @Post('relationships')
  @ApiOperation({ summary: 'Create a relationship between two people' })
  async createRelationship(
    @Body() body: { sourcePersonId: string; targetPersonId: string; relationshipType: string }
  ) {
    return this.peopleService.createRelationship(
      body.sourcePersonId,
      body.targetPersonId,
      body.relationshipType
    );
  }

  @Get('relationships/all')
  @ApiOperation({ summary: 'Get all relationships with person details for graph visualization' })
  async getAllRelationshipsWithPeople() {
    return this.peopleService.getAllRelationshipsWithPeople();
  }

  @Get(':id/relationships')
  @ApiOperation({ summary: 'Get all relationships for a person' })
  async getRelationships(@Param('id') id: string) {
    return this.peopleService.getRelationships(id);
  }

  @Delete('relationships/:relationshipId')
  @ApiOperation({ summary: 'Delete a relationship' })
  async deleteRelationship(@Param('relationshipId') relationshipId: string) {
    return this.peopleService.deleteRelationship(relationshipId);
  }
}
