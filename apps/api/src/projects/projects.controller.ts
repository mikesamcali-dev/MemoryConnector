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
}
