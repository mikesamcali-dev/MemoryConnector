import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBios() {
  console.log('Finding people with JSON in bio field...');

  // Find all people with JSON-like bios
  const people = await prisma.person.findMany({
    where: {
      bio: {
        contains: '"confidence_score"'
      }
    }
  });

  console.log(`Found ${people.length} people with JSON in bio field`);

  for (const person of people) {
    try {
      const jsonData = JSON.parse(person.bio);

      // Build human-readable bio
      const bioParts: string[] = [];
      if (jsonData.inferred_profession) {
        bioParts.push(jsonData.inferred_profession);
      }
      if (jsonData.inferred_age_range) {
        bioParts.push(`Age: ${jsonData.inferred_age_range}`);
      }
      if (jsonData.inferred_gender) {
        bioParts.push(`Gender: ${jsonData.inferred_gender}`);
      }

      const newBio = bioParts.length > 0 ? bioParts.join(' • ') : null;

      await prisma.person.update({
        where: { id: person.id },
        data: { bio: newBio }
      });

      console.log(`✓ Fixed: ${person.displayName} -> ${newBio || '(no bio)'}`);
    } catch (e) {
      console.log(`⚠ Skipped: ${person.displayName} (not valid JSON)`);
    }
  }

  console.log('\nDone! All bios have been fixed.');
  await prisma.$disconnect();
}

fixBios().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
