#!/usr/bin/env node
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const interestCount = await prisma.interest.count();
    // eslint-disable-next-line no-console
    console.log('Veritabani baglantisi basarili.');
    // eslint-disable-next-line no-console
    console.log(`Ilgi alani sayisi: ${interestCount}`);
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Veritabani baglantisi basarisiz:', err.message);
    // eslint-disable-next-line no-console
    console.error('\nCozum:');
    // eslint-disable-next-line no-console
    console.error('  1. Docker Desktop acin');
    // eslint-disable-next-line no-console
    console.error('  2. docker compose up -d');
    // eslint-disable-next-line no-console
    console.error('  3. npm run db:migrate');
    // eslint-disable-next-line no-console
    console.error('  4. npm run db:seed');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
