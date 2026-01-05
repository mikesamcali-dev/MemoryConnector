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
        imageLinks: {
          include: {
            image: {
              select: {
                id: true,
                storageUrl: true,
                thumbnailUrl256: true,
                thumbnailUrl1024: true,
                contentType: true,
                capturedAt: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        urlPageLinks: {
          include: {
            urlPage: {
              select: {
                id: true,
                url: true,
                title: true,
                description: true,
                imageUrl: true,
                siteName: true,
                author: true,
                publishedAt: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        youtubeVideoLinks: {
          include: {
            youtubeVideo: {
              select: {
                id: true,
                youtubeVideoId: true,
                title: true,
                description: true,
                thumbnailUrl: true,
                creatorDisplayName: true,
                publishedAt: true,
                durationSeconds: true,
                viewCount: true,
                likeCount: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        tiktokVideoLinks: {
          include: {
            tiktokVideo: {
              select: {
                id: true,
                tiktokVideoId: true,
                title: true,
                description: true,
                thumbnailUrl: true,
                creatorDisplayName: true,
                creatorUsername: true,
                publishedAt: true,
                durationSeconds: true,
                viewCount: true,
                likeCount: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        _count: {
          select: {
            memoryLinks: true,
            imageLinks: true,
            urlPageLinks: true,
            youtubeVideoLinks: true,
            tiktokVideoLinks: true,
          },
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

  /**
   * Link an image to a project
   * Validates ownership of both image and project
   */
  async linkImageToProject(
    imageId: string,
    projectId: string,
    userId: string,
  ) {
    // Verify image ownership
    const image = await this.prisma.image.findFirst({
      where: { id: imageId, userId },
    });

    if (!image) {
      throw new HttpException(
        'Image not found or you do not have permission to link it',
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
    const existingLink = await this.prisma.projectImageLink.findUnique({
      where: {
        projectId_imageId: {
          projectId,
          imageId,
        },
      },
    });

    if (existingLink) {
      throw new HttpException(
        'Image is already linked to this project',
        HttpStatus.CONFLICT,
      );
    }

    // Create link
    const link = await this.prisma.projectImageLink.create({
      data: {
        projectId,
        imageId,
      },
    });

    return link;
  }

  /**
   * Unlink an image from a project
   * Validates ownership
   */
  async unlinkImageFromProject(
    imageId: string,
    projectId: string,
    userId: string,
  ) {
    // Verify ownership of both entities
    const image = await this.prisma.image.findFirst({
      where: { id: imageId, userId },
    });

    if (!image) {
      throw new HttpException(
        'Image not found or you do not have permission to unlink it',
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
    const link = await this.prisma.projectImageLink.findUnique({
      where: {
        projectId_imageId: {
          projectId,
          imageId,
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
    await this.prisma.projectImageLink.delete({
      where: {
        id: link.id,
      },
    });

    return { success: true, message: 'Image unlinked from project successfully' };
  }

  /**
   * Link a URL page to a project
   * Validates ownership of both URL page and project
   */
  async linkUrlPageToProject(
    urlPageId: string,
    projectId: string,
    userId: string,
  ) {
    // Verify URL page ownership
    const urlPage = await this.prisma.urlPage.findFirst({
      where: { id: urlPageId, userId },
    });

    if (!urlPage) {
      throw new HttpException(
        'URL page not found or you do not have permission to link it',
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
    const existingLink = await this.prisma.projectUrlPageLink.findUnique({
      where: {
        projectId_urlPageId: {
          projectId,
          urlPageId,
        },
      },
    });

    if (existingLink) {
      throw new HttpException(
        'URL page is already linked to this project',
        HttpStatus.CONFLICT,
      );
    }

    // Create link
    const link = await this.prisma.projectUrlPageLink.create({
      data: {
        projectId,
        urlPageId,
      },
    });

    return link;
  }

  /**
   * Unlink a URL page from a project
   * Validates ownership
   */
  async unlinkUrlPageFromProject(
    urlPageId: string,
    projectId: string,
    userId: string,
  ) {
    // Verify ownership of both entities
    const urlPage = await this.prisma.urlPage.findFirst({
      where: { id: urlPageId, userId },
    });

    if (!urlPage) {
      throw new HttpException(
        'URL page not found or you do not have permission to unlink it',
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
    const link = await this.prisma.projectUrlPageLink.findUnique({
      where: {
        projectId_urlPageId: {
          projectId,
          urlPageId,
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
    await this.prisma.projectUrlPageLink.delete({
      where: {
        id: link.id,
      },
    });

    return { success: true, message: 'URL page unlinked from project successfully' };
  }

  /**
   * Link a YouTube video to a project
   * Validates project ownership and video existence
   */
  async linkYouTubeVideoToProject(
    youtubeVideoId: string,
    projectId: string,
    userId: string,
  ) {
    // Verify YouTube video exists
    const youtubeVideo = await this.prisma.youTubeVideo.findUnique({
      where: { id: youtubeVideoId },
    });

    if (!youtubeVideo) {
      throw new HttpException(
        'YouTube video not found',
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
    const existingLink = await this.prisma.projectYouTubeVideoLink.findUnique({
      where: {
        projectId_youtubeVideoId: {
          projectId,
          youtubeVideoId,
        },
      },
    });

    if (existingLink) {
      throw new HttpException(
        'YouTube video is already linked to this project',
        HttpStatus.CONFLICT,
      );
    }

    // Create link
    const link = await this.prisma.projectYouTubeVideoLink.create({
      data: {
        projectId,
        youtubeVideoId,
      },
    });

    return link;
  }

  /**
   * Unlink a YouTube video from a project
   * Validates ownership
   */
  async unlinkYouTubeVideoFromProject(
    youtubeVideoId: string,
    projectId: string,
    userId: string,
  ) {
    // Verify project ownership
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
    const link = await this.prisma.projectYouTubeVideoLink.findUnique({
      where: {
        projectId_youtubeVideoId: {
          projectId,
          youtubeVideoId,
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
    await this.prisma.projectYouTubeVideoLink.delete({
      where: {
        id: link.id,
      },
    });

    return { success: true, message: 'YouTube video unlinked from project successfully' };
  }

  /**
   * Link a TikTok video to a project
   * Validates project ownership and video existence
   */
  async linkTikTokVideoToProject(
    tiktokVideoId: string,
    projectId: string,
    userId: string,
  ) {
    // Verify TikTok video exists
    const tiktokVideo = await this.prisma.tikTokVideo.findUnique({
      where: { id: tiktokVideoId },
    });

    if (!tiktokVideo) {
      throw new HttpException(
        'TikTok video not found',
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
    const existingLink = await this.prisma.projectTikTokVideoLink.findUnique({
      where: {
        projectId_tiktokVideoId: {
          projectId,
          tiktokVideoId,
        },
      },
    });

    if (existingLink) {
      throw new HttpException(
        'TikTok video is already linked to this project',
        HttpStatus.CONFLICT,
      );
    }

    // Create link
    const link = await this.prisma.projectTikTokVideoLink.create({
      data: {
        projectId,
        tiktokVideoId,
      },
    });

    return link;
  }

  /**
   * Unlink a TikTok video from a project
   * Validates ownership
   */
  async unlinkTikTokVideoFromProject(
    tiktokVideoId: string,
    projectId: string,
    userId: string,
  ) {
    // Verify project ownership
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
    const link = await this.prisma.projectTikTokVideoLink.findUnique({
      where: {
        projectId_tiktokVideoId: {
          projectId,
          tiktokVideoId,
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
    await this.prisma.projectTikTokVideoLink.delete({
      where: {
        id: link.id,
      },
    });

    return { success: true, message: 'TikTok video unlinked from project successfully' };
  }
}
