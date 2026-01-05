import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns list of projects with memory counts' })
  async getAllProjects(@Req() req: any) {
    return this.projectsService.findAllByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID with memory links' })
  @ApiResponse({ status: 200, description: 'Returns project details' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProject(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.findById(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createProject(@Body() dto: CreateProjectDto, @Req() req: any) {
    return this.projectsService.create(req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async updateProject(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Req() req: any,
  ) {
    return this.projectsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async deleteProject(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.delete(id, req.user.id);
  }

  @Post(':id/memories/:memoryId')
  @ApiOperation({ summary: 'Link a memory to a project' })
  @ApiResponse({ status: 201, description: 'Memory linked successfully' })
  @ApiResponse({ status: 404, description: 'Project or memory not found' })
  @ApiResponse({ status: 409, description: 'Memory already linked to project' })
  async linkMemory(
    @Param('id') projectId: string,
    @Param('memoryId') memoryId: string,
    @Req() req: any,
  ) {
    return this.projectsService.linkMemoryToProject(
      memoryId,
      projectId,
      req.user.id,
    );
  }

  @Delete(':id/memories/:memoryId')
  @ApiOperation({ summary: 'Unlink a memory from a project' })
  @ApiResponse({ status: 200, description: 'Memory unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Project, memory, or link not found' })
  async unlinkMemory(
    @Param('id') projectId: string,
    @Param('memoryId') memoryId: string,
    @Req() req: any,
  ) {
    return this.projectsService.unlinkMemoryFromProject(
      memoryId,
      projectId,
      req.user.id,
    );
  }

  @Post(':id/images/:imageId')
  @ApiOperation({ summary: 'Link an image to a project' })
  @ApiResponse({ status: 201, description: 'Image linked successfully' })
  @ApiResponse({ status: 404, description: 'Project or image not found' })
  @ApiResponse({ status: 409, description: 'Image already linked to project' })
  async linkImage(
    @Param('id') projectId: string,
    @Param('imageId') imageId: string,
    @Req() req: any,
  ) {
    return this.projectsService.linkImageToProject(
      imageId,
      projectId,
      req.user.id,
    );
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Unlink an image from a project' })
  @ApiResponse({ status: 200, description: 'Image unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Project, image, or link not found' })
  async unlinkImage(
    @Param('id') projectId: string,
    @Param('imageId') imageId: string,
    @Req() req: any,
  ) {
    return this.projectsService.unlinkImageFromProject(
      imageId,
      projectId,
      req.user.id,
    );
  }

  @Post(':id/url-pages/:urlPageId')
  @ApiOperation({ summary: 'Link a URL page to a project' })
  @ApiResponse({ status: 201, description: 'URL page linked successfully' })
  @ApiResponse({ status: 404, description: 'Project or URL page not found' })
  @ApiResponse({ status: 409, description: 'URL page already linked to project' })
  async linkUrlPage(
    @Param('id') projectId: string,
    @Param('urlPageId') urlPageId: string,
    @Req() req: any,
  ) {
    return this.projectsService.linkUrlPageToProject(
      urlPageId,
      projectId,
      req.user.id,
    );
  }

  @Delete(':id/url-pages/:urlPageId')
  @ApiOperation({ summary: 'Unlink a URL page from a project' })
  @ApiResponse({ status: 200, description: 'URL page unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Project, URL page, or link not found' })
  async unlinkUrlPage(
    @Param('id') projectId: string,
    @Param('urlPageId') urlPageId: string,
    @Req() req: any,
  ) {
    return this.projectsService.unlinkUrlPageFromProject(
      urlPageId,
      projectId,
      req.user.id,
    );
  }

  @Post(':id/youtube-videos/:youtubeVideoId')
  @ApiOperation({ summary: 'Link a YouTube video to a project' })
  @ApiResponse({ status: 201, description: 'YouTube video linked successfully' })
  @ApiResponse({ status: 404, description: 'Project or YouTube video not found' })
  @ApiResponse({ status: 409, description: 'YouTube video already linked to project' })
  async linkYouTubeVideo(
    @Param('id') projectId: string,
    @Param('youtubeVideoId') youtubeVideoId: string,
    @Req() req: any,
  ) {
    return this.projectsService.linkYouTubeVideoToProject(
      youtubeVideoId,
      projectId,
      req.user.id,
    );
  }

  @Delete(':id/youtube-videos/:youtubeVideoId')
  @ApiOperation({ summary: 'Unlink a YouTube video from a project' })
  @ApiResponse({ status: 200, description: 'YouTube video unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Project, YouTube video, or link not found' })
  async unlinkYouTubeVideo(
    @Param('id') projectId: string,
    @Param('youtubeVideoId') youtubeVideoId: string,
    @Req() req: any,
  ) {
    return this.projectsService.unlinkYouTubeVideoFromProject(
      youtubeVideoId,
      projectId,
      req.user.id,
    );
  }

  @Post(':id/tiktok-videos/:tiktokVideoId')
  @ApiOperation({ summary: 'Link a TikTok video to a project' })
  @ApiResponse({ status: 201, description: 'TikTok video linked successfully' })
  @ApiResponse({ status: 404, description: 'Project or TikTok video not found' })
  @ApiResponse({ status: 409, description: 'TikTok video already linked to project' })
  async linkTikTokVideo(
    @Param('id') projectId: string,
    @Param('tiktokVideoId') tiktokVideoId: string,
    @Req() req: any,
  ) {
    return this.projectsService.linkTikTokVideoToProject(
      tiktokVideoId,
      projectId,
      req.user.id,
    );
  }

  @Delete(':id/tiktok-videos/:tiktokVideoId')
  @ApiOperation({ summary: 'Unlink a TikTok video from a project' })
  @ApiResponse({ status: 200, description: 'TikTok video unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Project, TikTok video, or link not found' })
  async unlinkTikTokVideo(
    @Param('id') projectId: string,
    @Param('tiktokVideoId') tiktokVideoId: string,
    @Req() req: any,
  ) {
    return this.projectsService.unlinkTikTokVideoFromProject(
      tiktokVideoId,
      projectId,
      req.user.id,
    );
  }
}
