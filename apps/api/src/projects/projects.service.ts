import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new project for a user
   */
  async create(userId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description || null,
        tags: dto.tags || [],
      },
      include: {
        _count: {
          select: { memoryLinks: true },
        },
      },
    });
  }

  /**
   * Get all projects for a user with memory counts
   */
  async findAllByUser(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      include: {
        _count: {
          select: { memoryLinks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single project by ID with memory links
   * Validates ownership
   */
  async findById(id: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: {
        memoryLinks: {
          include: {
            memory: {
              select: {
                id: true,
                body: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 100, // Limit to 100 most recent memories
        },
        _count: {
          select: { memoryLinks: true },
        },
      },
    });

    if (!project) {
      throw new HttpException(
        'Project not found or you do not have permission to view it',
        HttpStatus.NOT_FOUND,
      );
    }

    return project;
  }

  /**
   * Update a project
   * Validates ownership
   */
  async update(id: string, userId: string, dto: UpdateProjectDto) {
    // Verify ownership
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      throw new HttpException(
        'Project not found or you do not have permission to update it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Update project
    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        tags: dto.tags,
      },
      include: {
        _count: {
          select: { memoryLinks: true },
        },
      },
    });
  }

  /**
   * Delete a project
   * Validates ownership
   * Cascading deletes will remove all MemoryProjectLink entries
   */
  async delete(id: string, userId: string) {
    // Verify ownership
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      throw new HttpException(
        'Project not found or you do not have permission to delete it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Delete project (cascade will remove links)
    await this.prisma.project.delete({
      where: { id },
    });

    return { success: true, message: 'Project deleted successfully' };
  }

  /**
   * Link a memory to a project
   * Validates ownership of both memory and project
   */
  async linkMemoryToProject(
    memoryId: string,
    projectId: string,
    userId: string,
  ) {
    // Verify memory ownership
    const memory = await this.prisma.memory.findFirst({
      where: { id: memoryId, userId },
    });

    if (!memory) {
      throw new HttpException(
        'Memory not found or you do not have permission to link it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Verify project ownership
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new HttpException(
        'Project not found or you do not have permission to link to it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if link already exists
    const existingLink = await this.prisma.memoryProjectLink.findUnique({
      where: {
        memoryId_projectId: {
          memoryId,
          projectId,
        },
      },
    });

    if (existingLink) {
      throw new HttpException(
        'Memory is already linked to this project',
        HttpStatus.CONFLICT,
      );
    }

    // Create link
    const link = await this.prisma.memoryProjectLink.create({
      data: {
        memoryId,
        projectId,
      },
      include: {
        memory: {
          select: {
            id: true,
            body: true,
            createdAt: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return link;
  }

  /**
   * Unlink a memory from a project
   * Validates ownership
   */
  async unlinkMemoryFromProject(
    memoryId: string,
    projectId: string,
    userId: string,
  ) {
    // Verify ownership of both entities
    const memory = await this.prisma.memory.findFirst({
      where: { id: memoryId, userId },
    });

    if (!memory) {
      throw new HttpException(
        'Memory not found or you do not have permission to unlink it',
        HttpStatus.NOT_FOUND,
      );
    }

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new HttpException(
        'Project not found or you do not have permission to unlink from it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Find the link
    const link = await this.prisma.memoryProjectLink.findUnique({
      where: {
        memoryId_projectId: {
          memoryId,
          projectId,
        },
      },
    });

    if (!link) {
      throw new HttpException(
        'Link not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Delete the link
    await this.prisma.memoryProjectLink.delete({
      where: {
        id: link.id,
      },
    });

    return { success: true, message: 'Memory unlinked from project successfully' };
  }
}
