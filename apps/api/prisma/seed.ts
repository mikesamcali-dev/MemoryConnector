import { PrismaClient, StorageStrategy } from '@prisma/client';
import * as argon2 from 'argon2';
import { conceptMappingsSeed } from './seeds/concept-mappings.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed tier limits
  await prisma.tierLimit.upsert({
    where: { tier: 'free' },
    update: {},
    create: {
      tier: 'free',
      memoriesPerDay: 10,
      memoriesPerMonth: 100,
      imagesPerMonth: 20,
      voicePerMonth: 20,
      searchesPerDay: 50,
      storageBytes: BigInt(104857600), // 100 MB
      apiRatePerMin: 100,
    },
  });

  await prisma.tierLimit.upsert({
    where: { tier: 'premium' },
    update: {},
    create: {
      tier: 'premium',
      memoriesPerDay: 100,
      memoriesPerMonth: -1, // unlimited
      imagesPerMonth: 500,
      voicePerMonth: 500,
      searchesPerDay: -1, // unlimited
      storageBytes: BigInt(10737418240), // 10 GB
      apiRatePerMin: 1000,
    },
  });

  // Create test user
  const passwordHash = await argon2.hash('password123');
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash,
      tier: 'free',
      roles: ['user'],
    },
  });

  // Create user usage record
  await prisma.userUsage.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      memoriesToday: 0,
      memoriesThisMonth: 0,
      imagesThisMonth: 0,
      voiceThisMonth: 0,
      searchesToday: 0,
      storageBytes: BigInt(0),
      lastDailyReset: new Date(),
      lastMonthlyReset: new Date(),
    },
  });

  // Seed memory types with hybrid storage strategies
  const memoryTypes = [
    {
      code: 'event',
      label: 'Event',
      description: 'Important events and occasions',
      icon: '📅',
      color: '#3B82F6',
      storageStrategy: StorageStrategy.structured,
      tableName: 'events',
      enabled: true,
      sortOrder: 1,
    },
    {
      code: 'person',
      label: 'Person',
      description: 'People you meet and know',
      icon: '👤',
      color: '#8B5CF6',
      storageStrategy: StorageStrategy.structured,
      tableName: 'people',
      enabled: true,
      sortOrder: 2,
    },
    {
      code: 'word',
      label: 'Word',
      description: 'Important words and vocabulary',
      icon: '📝',
      color: '#10B981',
      storageStrategy: StorageStrategy.structured,
      tableName: 'words',
      enabled: true,
      sortOrder: 3,
    },
    {
      code: 'location',
      label: 'Location',
      description: 'Places you visit',
      icon: '📍',
      color: '#EF4444',
      storageStrategy: StorageStrategy.structured,
      tableName: 'locations',
      enabled: true,
      sortOrder: 4,
    },
    {
      code: 'note',
      label: 'Note',
      description: 'General notes and thoughts',
      icon: '📝',
      color: '#6B7280',
      storageStrategy: StorageStrategy.generic,
      tableName: null,
      enabled: true,
      sortOrder: 5,
    },
    {
      code: 'idea',
      label: 'Idea',
      description: 'Creative ideas and inspirations',
      icon: '💡',
      color: '#F59E0B',
      storageStrategy: StorageStrategy.generic,
      tableName: null,
      enabled: true,
      sortOrder: 6,
    },
    {
      code: 'quote',
      label: 'Quote',
      description: 'Memorable quotes and phrases',
      icon: '💬',
      color: '#EC4899',
      storageStrategy: StorageStrategy.generic,
      tableName: null,
      enabled: true,
      sortOrder: 7,
    },
  ];

  const createdTypes: Record<string, any> = {};
  for (const type of memoryTypes) {
    const memoryType = await prisma.memoryType.upsert({
      where: { code: type.code },
      update: {},
      create: type,
    });
    createdTypes[type.code] = memoryType;
  }

  console.log(`Created ${memoryTypes.length} memory types`);

  // Create test memories with new structure

  // Example 1: Generic note memory
  const noteMemory = await prisma.memory.create({
    data: {
      userId: testUser.id,
      title: 'First Memory',
      body: 'This is my first memory. I want to remember this moment.',
      occurredAt: new Date(),
      state: 'SAVED',
    },
  });

  // Link it to "note" type
  await prisma.memoryTypeAssignment.create({
    data: {
      memoryId: noteMemory.id,
      memoryTypeId: createdTypes['note'].id,
      confidence: 1.0,
    },
  });

  // Example 2: Event memory with structured data
  const eventMemory = await prisma.memory.create({
    data: {
      userId: testUser.id,
      title: 'Team Meeting',
      body: 'Quarterly planning meeting with the entire team',
      occurredAt: new Date(),
      startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2 hours
      state: 'SAVED',
    },
  });

  // Create structured event data
  await prisma.event.create({
    data: {
      memoryId: eventMemory.id,
      startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      timezone: 'America/Los_Angeles',
      description: 'Q1 planning and team alignment',
      tags: ['work', 'planning', 'quarterly'],
    },
  });

  // Link to event type
  await prisma.memoryTypeAssignment.create({
    data: {
      memoryId: eventMemory.id,
      memoryTypeId: createdTypes['event'].id,
      confidence: 1.0,
    },
  });

  // Example 3: Location memory with structured data
  const locationMemory = await prisma.memory.create({
    data: {
      userId: testUser.id,
      title: 'Downtown Coffee Shop',
      body: 'Cozy coffee shop with great espresso and friendly staff',
      latitude: 37.7749,
      longitude: -122.4194,
      occurredAt: new Date(),
      state: 'SAVED',
    },
  });

  // Create shared location entity
  const downtownCoffeeShop = await prisma.location.create({
    data: {
      name: 'Downtown Coffee Shop',
      address: '123 Market Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      latitude: 37.7749,
      longitude: -122.4194,
      placeType: 'cafe',
    },
  });

  // Link memory to location
  await prisma.memory.update({
    where: { id: locationMemory.id },
    data: { locationId: downtownCoffeeShop.id },
  });

  // Link to location type
  await prisma.memoryTypeAssignment.create({
    data: {
      memoryId: locationMemory.id,
      memoryTypeId: createdTypes['location'].id,
      confidence: 1.0,
    },
  });

  // Example 4: Word memory with structured data
  const wordMemory = await prisma.memory.create({
    data: {
      userId: testUser.id,
      title: 'Serendipity',
      body: 'A happy accident or pleasant surprise',
      occurredAt: new Date(),
      state: 'SAVED',
    },
  });

  // Create structured word data
  const serendipityWord = await prisma.word.create({
    data: {
      word: 'serendipity',
      description: 'The occurrence of events by chance in a happy or beneficial way',
      phonetic: '/ˌser.ənˈdɪp.ə.ti/',
      partOfSpeech: 'noun',
      etymology: 'Coined by Horace Walpole in 1754',
      examples: JSON.parse('["Finding my old friend at the airport was pure serendipity", "The discovery was a fortunate serendipity"]'),
      synonyms: JSON.parse('["chance", "fortune", "luck", "happenstance"]'),
      antonyms: JSON.parse('["misfortune", "bad luck"]'),
      difficulty: 'medium',
    },
  });

  // Link word to memory
  await prisma.memoryWordLink.create({
    data: {
      memoryId: wordMemory.id,
      wordId: serendipityWord.id,
    },
  });

  // Link to word type
  await prisma.memoryTypeAssignment.create({
    data: {
      memoryId: wordMemory.id,
      memoryTypeId: createdTypes['word'].id,
      confidence: 1.0,
    },
  });

  // Example 5: Person memory with structured data
  const personMemory = await prisma.memory.create({
    data: {
      userId: testUser.id,
      title: 'John Smith',
      body: 'Met John at the coffee shop. He mentioned he is working on a new project related to AI.',
      occurredAt: new Date(),
      state: 'SAVED',
    },
  });

  // Create structured person data (standalone entity)
  const person = await prisma.person.create({
    data: {
      displayName: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+1-555-0123',
      bio: 'Software engineer working on AI projects',
    },
  });

  // Link person to memory
  await prisma.memory.update({
    where: { id: personMemory.id },
    data: { personId: person.id },
  });

  // Link to person type
  await prisma.memoryTypeAssignment.create({
    data: {
      memoryId: personMemory.id,
      memoryTypeId: createdTypes['person'].id,
      confidence: 1.0,
    },
  });

  // Example 6: Generic idea memory
  const ideaMemory = await prisma.memory.create({
    data: {
      userId: testUser.id,
      title: 'App Idea: Habit Tracker',
      body: 'Build a simple habit tracking app that uses AI to provide personalized insights',
      occurredAt: new Date(),
      data: JSON.parse('{"category": "productivity", "tags": ["app", "AI", "habits"], "priority": "high"}'),
      state: 'SAVED',
    },
  });

  // Link to idea type
  await prisma.memoryTypeAssignment.create({
    data: {
      memoryId: ideaMemory.id,
      memoryTypeId: createdTypes['idea'].id,
      confidence: 1.0,
    },
  });

  // Create a memory link (event happens at location)
  await prisma.memoryLink.create({
    data: {
      sourceId: eventMemory.id,
      targetId: locationMemory.id,
      linkType: 'locatedAt',
      metadata: JSON.parse('{"notes": "Meeting will be held at the coffee shop"}'),
    },
  });

  // Create a test reminder
  await prisma.reminder.create({
    data: {
      userId: testUser.id,
      memoryId: eventMemory.id,
      scheduledAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
      status: 'pending',
    },
  });

  console.log('Seeding completed!');
  console.log(`Test user: test@example.com / password123`);
  console.log('Created 6 test memories with various types:');
  console.log('  - 1 generic note');
  console.log('  - 1 structured event');
  console.log('  - 1 structured location');
  console.log('  - 1 structured word');
  console.log('  - 1 structured person');
  console.log('  - 1 generic idea');
  console.log('  - 1 memory link (event at location)');

  // Seed concept mappings for keyword expansion
  console.log('\nSeeding concept mappings...');
  let mappingsCreated = 0;
  for (const mapping of conceptMappingsSeed) {
    await prisma.conceptMapping.upsert({
      where: { term: mapping.term },
      create: mapping,
      update: mapping,
    });
    mappingsCreated++;
  }
  console.log(`  - ${mappingsCreated} concept mappings`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
