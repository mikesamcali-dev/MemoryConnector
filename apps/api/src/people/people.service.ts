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
   * Get person by ID
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
}
