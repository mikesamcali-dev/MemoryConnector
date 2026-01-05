import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PeopleService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a standalone person
   */
  async create(displayName: string, email?: string, phone?: string, bio?: string): Promise<any> {
    const normalizedName = displayName.trim();

    // Check if person with same name already exists
    const existing = await this.prisma.person.findFirst({
      where: {
        displayName: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      console.log('Found existing person:', existing.id);
      return existing;
    }

    // Create new person
    console.log('Creating new person:', normalizedName);
    const person = await this.prisma.person.create({
      data: {
        displayName: normalizedName,
        email,
        phone,
        bio,
      },
    });

    console.log('Person created:', person.id);
    return person;
  }

  /**
   * Get all people
   */
  async findAll(): Promise<any[]> {
    return this.prisma.person.findMany({
      orderBy: { displayName: 'asc' },
      include: {
        _count: {
          select: { memories: true },
        },
      },
    });
  }

  /**
   * Get person by ID with all linked content
   */
  async findById(id: string): Promise<any> {
    const person = await this.prisma.person.findUnique({
      where: { id },
      include: {
        memories: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
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
          take: 100,
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
            memories: true,
            memoryLinks: true,
            imageLinks: true,
            urlPageLinks: true,
            youtubeVideoLinks: true,
            tiktokVideoLinks: true,
            relationshipsFrom: true,
            relationshipsTo: true,
          },
        },
      },
    });

    if (!person) {
      throw new HttpException('Person not found', HttpStatus.NOT_FOUND);
    }

    return person;
  }

  /**
   * Search people by name
   */
  async search(query: string): Promise<any[]> {
    return this.prisma.person.findMany({
      where: {
        displayName: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: { displayName: 'asc' },
      take: 20,
    });
  }

  /**
   * Update a person
   */
  async updatePerson(id: string, updateData: any): Promise<any> {
    const person = await this.prisma.person.findUnique({
      where: { id },
    });

    if (!person) {
      throw new HttpException('Person not found', HttpStatus.NOT_FOUND);
    }

    const updatedPerson = await this.prisma.person.update({
      where: { id },
      data: {
        ...(updateData.displayName !== undefined && { displayName: updateData.displayName }),
        ...(updateData.email !== undefined && { email: updateData.email }),
        ...(updateData.phone !== undefined && { phone: updateData.phone }),
        ...(updateData.bio !== undefined && { bio: updateData.bio }),
      },
    });

    console.log('Person updated:', updatedPerson.id);
    return updatedPerson;
  }

  /**
   * Delete a person
   */
  async deletePerson(id: string): Promise<void> {
    const person = await this.prisma.person.findUnique({
      where: { id },
    });

    if (!person) {
      throw new HttpException('Person not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.person.delete({
      where: { id },
    });

    console.log('Person deleted:', id);
  }

  /**
   * Create a relationship between two people
   */
  async createRelationship(
    sourcePersonId: string,
    targetPersonId: string,
    relationshipType: string
  ): Promise<any> {
    // Verify both people exist
    const [sourcePerson, targetPerson] = await Promise.all([
      this.prisma.person.findUnique({ where: { id: sourcePersonId } }),
      this.prisma.person.findUnique({ where: { id: targetPersonId } }),
    ]);

    if (!sourcePerson || !targetPerson) {
      throw new HttpException('One or both people not found', HttpStatus.NOT_FOUND);
    }

    // Create relationship
    const relationship = await this.prisma.personRelationship.create({
      data: {
        sourcePersonId,
        targetPersonId,
        relationshipType,
      },
      include: {
        sourcePerson: true,
        targetPerson: true,
      },
    });

    console.log('Relationship created:', relationship.id);
    return relationship;
  }

  /**
   * Get all relationships for a person
   */
  async getRelationships(personId: string): Promise<any[]> {
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
    });

    if (!person) {
      throw new HttpException('Person not found', HttpStatus.NOT_FOUND);
    }

    const [outgoing, incoming] = await Promise.all([
      this.prisma.personRelationship.findMany({
        where: { sourcePersonId: personId },
        include: { targetPerson: true },
      }),
      this.prisma.personRelationship.findMany({
        where: { targetPersonId: personId },
        include: { sourcePerson: true },
      }),
    ]);

    return [...outgoing, ...incoming];
  }

  /**
   * Delete a relationship
   */
  async deleteRelationship(relationshipId: string): Promise<void> {
    const relationship = await this.prisma.personRelationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      throw new HttpException('Relationship not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.personRelationship.delete({
      where: { id: relationshipId },
    });

    console.log('Relationship deleted:', relationshipId);
  }

  /**
   * Get all relationships with person details for graph visualization
   */
  async getAllRelationshipsWithPeople(): Promise<{
    people: any[];
    relationships: any[];
  }> {
    const [people, relationships] = await Promise.all([
      // Fetch all people with counts
      this.prisma.person.findMany({
        orderBy: { displayName: 'asc' },
        select: {
          id: true,
          displayName: true,
          email: true,
          phone: true,
          bio: true,
          _count: {
            select: {
              memories: true,
              relationshipsFrom: true,
              relationshipsTo: true,
            },
          },
        },
      }),
      // Fetch all relationships with source and target person details
      this.prisma.personRelationship.findMany({
        include: {
          sourcePerson: {
            select: {
              id: true,
              displayName: true,
            },
          },
          targetPerson: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      people,
      relationships,
    };
  }

  /**
   * Link a memory to a person
   * Validates ownership of memory
   */
  async linkMemoryToPerson(
    memoryId: string,
    personId: string,
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

    // Verify person exists
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
    });

    if (!person) {
      throw new HttpException(
        'Person not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if link already exists
    const existingLink = await this.prisma.memoryPersonLink.findUnique({
      where: {
        memoryId_personId: {
          memoryId,
          personId,
        },
      },
    });

    if (existingLink) {
      throw new HttpException(
        'Memory is already linked to this person',
        HttpStatus.CONFLICT,
      );
    }

    // Create link
    const link = await this.prisma.memoryPersonLink.create({
      data: {
        memoryId,
        personId,
      },
      include: {
        memory: {
          select: {
            id: true,
            body: true,
            createdAt: true,
          },
        },
        person: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    return link;
  }

  /**
   * Unlink a memory from a person
   * Validates ownership
   */
  async unlinkMemoryFromPerson(
    memoryId: string,
    personId: string,
    userId: string,
  ) {
    // Verify memory ownership
    const memory = await this.prisma.memory.findFirst({
      where: { id: memoryId, userId },
    });

    if (!memory) {
      throw new HttpException(
        'Memory not found or you do not have permission to unlink it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Verify person exists
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
    });

    if (!person) {
      throw new HttpException(
        'Person not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Find the link
    const link = await this.prisma.memoryPersonLink.findUnique({
      where: {
        memoryId_personId: {
          memoryId,
          personId,
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
    await this.prisma.memoryPersonLink.delete({
      where: {
        id: link.id,
      },
    });

    return { success: true, message: 'Memory unlinked from person successfully' };
  }

  /**
   * Link an image to a person
   * Validates ownership of image
   */
  async linkImageToPerson(
    imageId: string,
    personId: string,
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

    // Verify person exists
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
    });

    if (!person) {
      throw new HttpException(
        'Person not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if link already exists (for manual links without faceId)
    const existingLink = await this.prisma.imagePersonLink.findFirst({
      where: {
        imageId,
        personId,
        faceId: null,
      },
    });

    if (existingLink) {
      throw new HttpException(
        'Image is already linked to this person',
        HttpStatus.CONFLICT,
      );
    }

    // Create link
    const link = await this.prisma.imagePersonLink.create({
      data: {
        imageId,
        personId,
        faceId: null,
        linkMethod: 'manual',
      },
    });

    return link;
  }

  /**
   * Unlink an image from a person
   * Validates ownership
   */
  async unlinkImageFromPerson(
    imageId: string,
    personId: string,
    userId: string,
  ) {
    // Verify image ownership
    const image = await this.prisma.image.findFirst({
      where: { id: imageId, userId },
    });

    if (!image) {
      throw new HttpException(
        'Image not found or you do not have permission to unlink it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Verify person exists
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
    });

    if (!person) {
      throw new HttpException(
        'Person not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Find the link (manual link without faceId)
    const link = await this.prisma.imagePersonLink.findFirst({
      where: {
        imageId,
        personId,
        faceId: null,
      },
    });

    if (!link) {
      throw new HttpException(
        'Link not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Delete the link
    await this.prisma.imagePersonLink.delete({
      where: {
        id: link.id,
      },
    });

    return { success: true, message: 'Image unlinked from person successfully' };
  }

  /**
   * Link a URL page to a person
   * Validates ownership of URL page
   */
  async linkUrlPageToPerson(
    urlPageId: string,
    personId: string,
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

    // Verify person exists
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
    });

    if (!person) {
      throw new HttpException(
        'Person not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if link already exists
    const existingLink = await this.prisma.personUrlPageLink.findUnique({
      where: {
        personId_urlPageId: {
          personId,
          urlPageId,
        },
      },
    });

    if (existingLink) {
      throw new HttpException(
        'URL page is already linked to this person',
        HttpStatus.CONFLICT,
      );
    }

    // Create link
    const link = await this.prisma.personUrlPageLink.create({
      data: {
        personId,
        urlPageId,
      },
    });

    return link;
  }

  /**
   * Unlink a URL page from a person
   * Validates ownership
   */
  async unlinkUrlPageFromPerson(
    urlPageId: string,
    personId: string,
    userId: string,
  ) {
    // Verify URL page ownership
    const urlPage = await this.prisma.urlPage.findFirst({
      where: { id: urlPageId, userId },
    });

    if (!urlPage) {
      throw new HttpException(
        'URL page not found or you do not have permission to unlink it',
        HttpStatus.NOT_FOUND,
      );
    }

    // Verify person exists
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
    });

    if (!person) {
      throw new HttpException(
        'Person not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Find the link
    const link = await this.prisma.personUrlPageLink.findUnique({
      where: {
        personId_urlPageId: {
          personId,
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
    await this.prisma.personUrlPageLink.delete({
      where: {
        id: link.id,
      },
    });

    return { success: true, message: 'URL page unlinked from person successfully' };
  }

  /**
   * Link a YouTube video to a person
   * Validates person existence and video existence
   */
  async linkYouTubeVideoToPerson(
    youtubeVideoId: string,
    personId: string,
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

    // Verify person exists
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
    });

    if (!person) {
      throw new HttpException(
        'Person not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if link already exists
    const existingLink = await this.prisma.personYouTubeVideoLink.findUnique({
      where: {
        personId_youtubeVideoId: {
          personId,
          youtubeVideoId,
        },
      },
    });

    if (existingLink) {
      throw new HttpException(
        'YouTube video is already linked to this person',
        HttpStatus.CONFLICT,
      );
    }

    // Create link
    const link = await this.prisma.personYouTubeVideoLink.create({
      data: {
        personId,
        youtubeVideoId,
      },
    });

    return link;
  }

  /**
   * Unlink a YouTube video from a person
   */
  async unlinkYouTubeVideoFromPerson(
    youtubeVideoId: string,
    personId: string,
    userId: string,
  ) {
    // Verify person exists
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
    });

    if (!person) {
      throw new HttpException(
        'Person not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Find the link
    const link = await this.prisma.personYouTubeVideoLink.findUnique({
      where: {
        personId_youtubeVideoId: {
          personId,
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
    await this.prisma.personYouTubeVideoLink.delete({
      where: {
        id: link.id,
      },
    });

    return { success: true, message: 'YouTube video unlinked from person successfully' };
  }

  /**
   * Link a TikTok video to a person
   * Validates person existence and video existence
   */
  async linkTikTokVideoToPerson(
    tiktokVideoId: string,
    personId: string,
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

    // Verify person exists
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
    });

    if (!person) {
      throw new HttpException(
        'Person not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if link already exists
    const existingLink = await this.prisma.personTikTokVideoLink.findUnique({
      where: {
        personId_tiktokVideoId: {
          personId,
          tiktokVideoId,
        },
      },
    });

    if (existingLink) {
      throw new HttpException(
        'TikTok video is already linked to this person',
        HttpStatus.CONFLICT,
      );
    }

    // Create link
    const link = await this.prisma.personTikTokVideoLink.create({
      data: {
        personId,
        tiktokVideoId,
      },
    });

    return link;
  }

  /**
   * Unlink a TikTok video from a person
   */
  async unlinkTikTokVideoFromPerson(
    tiktokVideoId: string,
    personId: string,
    userId: string,
  ) {
    // Verify person exists
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
    });

    if (!person) {
      throw new HttpException(
        'Person not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Find the link
    const link = await this.prisma.personTikTokVideoLink.findUnique({
      where: {
        personId_tiktokVideoId: {
          personId,
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
    await this.prisma.personTikTokVideoLink.delete({
      where: {
        id: link.id,
      },
    });

    return { success: true, message: 'TikTok video unlinked from person successfully' };
  }
}
