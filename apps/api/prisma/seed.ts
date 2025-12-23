import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

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

  // Create a few test memories
  const memories = await Promise.all([
    prisma.memory.create({
      data: {
        userId: testUser.id,
        type: 'note',
        textContent: 'This is my first memory. I want to remember this moment.',
        state: 'SAVED',
      },
    }),
    prisma.memory.create({
      data: {
        userId: testUser.id,
        type: 'person',
        textContent: 'Met John at the coffee shop. He mentioned he is working on a new project.',
        state: 'SAVED',
      },
    }),
    prisma.memory.create({
      data: {
        userId: testUser.id,
        type: 'event',
        textContent: 'Team meeting scheduled for next Monday at 2 PM.',
        state: 'SAVED',
      },
    }),
  ]);

  // Create a test reminder
  await prisma.reminder.create({
    data: {
      userId: testUser.id,
      memoryId: memories[0].id,
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'pending',
    },
  });

  console.log('Seeding completed!');
  console.log(`Test user: test@example.com / password123`);
  console.log(`Created ${memories.length} test memories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

