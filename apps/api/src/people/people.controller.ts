import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
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

  @Post(':id/memories/:memoryId')
  @ApiOperation({ summary: 'Link a memory to a person' })
  @ApiResponse({ status: 201, description: 'Memory linked successfully' })
  @ApiResponse({ status: 404, description: 'Person or memory not found' })
  @ApiResponse({ status: 409, description: 'Memory already linked to person' })
  async linkMemory(
    @Param('id') personId: string,
    @Param('memoryId') memoryId: string,
    @Req() req: any,
  ) {
    return this.peopleService.linkMemoryToPerson(
      memoryId,
      personId,
      req.user.id,
    );
  }

  @Delete(':id/memories/:memoryId')
  @ApiOperation({ summary: 'Unlink a memory from a person' })
  @ApiResponse({ status: 200, description: 'Memory unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Person, memory, or link not found' })
  async unlinkMemory(
    @Param('id') personId: string,
    @Param('memoryId') memoryId: string,
    @Req() req: any,
  ) {
    return this.peopleService.unlinkMemoryFromPerson(
      memoryId,
      personId,
      req.user.id,
    );
  }

  @Post(':id/images/:imageId')
  @ApiOperation({ summary: 'Link an image to a person' })
  @ApiResponse({ status: 201, description: 'Image linked successfully' })
  @ApiResponse({ status: 404, description: 'Person or image not found' })
  @ApiResponse({ status: 409, description: 'Image already linked to person' })
  async linkImage(
    @Param('id') personId: string,
    @Param('imageId') imageId: string,
    @Req() req: any,
  ) {
    return this.peopleService.linkImageToPerson(
      imageId,
      personId,
      req.user.id,
    );
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Unlink an image from a person' })
  @ApiResponse({ status: 200, description: 'Image unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Person, image, or link not found' })
  async unlinkImage(
    @Param('id') personId: string,
    @Param('imageId') imageId: string,
    @Req() req: any,
  ) {
    return this.peopleService.unlinkImageFromPerson(
      imageId,
      personId,
      req.user.id,
    );
  }

  @Post(':id/url-pages/:urlPageId')
  @ApiOperation({ summary: 'Link a URL page to a person' })
  @ApiResponse({ status: 201, description: 'URL page linked successfully' })
  @ApiResponse({ status: 404, description: 'Person or URL page not found' })
  @ApiResponse({ status: 409, description: 'URL page already linked to person' })
  async linkUrlPage(
    @Param('id') personId: string,
    @Param('urlPageId') urlPageId: string,
    @Req() req: any,
  ) {
    return this.peopleService.linkUrlPageToPerson(
      urlPageId,
      personId,
      req.user.id,
    );
  }

  @Delete(':id/url-pages/:urlPageId')
  @ApiOperation({ summary: 'Unlink a URL page from a person' })
  @ApiResponse({ status: 200, description: 'URL page unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Person, URL page, or link not found' })
  async unlinkUrlPage(
    @Param('id') personId: string,
    @Param('urlPageId') urlPageId: string,
    @Req() req: any,
  ) {
    return this.peopleService.unlinkUrlPageFromPerson(
      urlPageId,
      personId,
      req.user.id,
    );
  }

  @Post(':id/youtube-videos/:youtubeVideoId')
  @ApiOperation({ summary: 'Link a YouTube video to a person' })
  @ApiResponse({ status: 201, description: 'YouTube video linked successfully' })
  @ApiResponse({ status: 404, description: 'Person or YouTube video not found' })
  @ApiResponse({ status: 409, description: 'YouTube video already linked to person' })
  async linkYouTubeVideo(
    @Param('id') personId: string,
    @Param('youtubeVideoId') youtubeVideoId: string,
    @Req() req: any,
  ) {
    return this.peopleService.linkYouTubeVideoToPerson(
      youtubeVideoId,
      personId,
      req.user.id,
    );
  }

  @Delete(':id/youtube-videos/:youtubeVideoId')
  @ApiOperation({ summary: 'Unlink a YouTube video from a person' })
  @ApiResponse({ status: 200, description: 'YouTube video unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Person, YouTube video, or link not found' })
  async unlinkYouTubeVideo(
    @Param('id') personId: string,
    @Param('youtubeVideoId') youtubeVideoId: string,
    @Req() req: any,
  ) {
    return this.peopleService.unlinkYouTubeVideoFromPerson(
      youtubeVideoId,
      personId,
      req.user.id,
    );
  }

  @Post(':id/tiktok-videos/:tiktokVideoId')
  @ApiOperation({ summary: 'Link a TikTok video to a person' })
  @ApiResponse({ status: 201, description: 'TikTok video linked successfully' })
  @ApiResponse({ status: 404, description: 'Person or TikTok video not found' })
  @ApiResponse({ status: 409, description: 'TikTok video already linked to person' })
  async linkTikTokVideo(
    @Param('id') personId: string,
    @Param('tiktokVideoId') tiktokVideoId: string,
    @Req() req: any,
  ) {
    return this.peopleService.linkTikTokVideoToPerson(
      tiktokVideoId,
      personId,
      req.user.id,
    );
  }

  @Delete(':id/tiktok-videos/:tiktokVideoId')
  @ApiOperation({ summary: 'Unlink a TikTok video from a person' })
  @ApiResponse({ status: 200, description: 'TikTok video unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Person, TikTok video, or link not found' })
  async unlinkTikTokVideo(
    @Param('id') personId: string,
    @Param('tiktokVideoId') tiktokVideoId: string,
    @Req() req: any,
  ) {
    return this.peopleService.unlinkTikTokVideoFromPerson(
      tiktokVideoId,
      personId,
      req.user.id,
    );
  }
}
