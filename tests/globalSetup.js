const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function getTestDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL;
  }
  const base = process.env.DATABASE_URL || '';
  return base.replace(/\/([^/?]+)(\?.*)?$/, '/$1_test$2');
}

async function ensureTestDatabase() {
  const testUrl = getTestDatabaseUrl();
  const parsed = new URL(testUrl);
  const dbName = parsed.pathname.slice(1);
  parsed.pathname = '/postgres';

  const { Client } = require('pg');
  const client = new Client({ connectionString: parsed.toString() });
  await client.connect();
  const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (exists.rowCount === 0) {
    await client.query(`CREATE DATABASE "${dbName}"`);
  }
  await client.end();
}

module.exports = async () => {
  const testUrl = getTestDatabaseUrl();
  await ensureTestDatabase();
  execSync('npx prisma migrate deploy', {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: 'inherit',
  });
};
