require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const INTERESTS = [
  'Technology',
  'Sports',
  'Music',
  'Art',
  'Science',
  'Travel',
  'Food',
  'Gaming',
];

async function main() {
  for (const name of INTERESTS) {
    await prisma.interest.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
  // eslint-disable-next-line no-console
  console.log(`Seed tamamlandi: ${INTERESTS.length} ilgi alani eklendi.`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Seed hatasi:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
