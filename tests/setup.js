require('dotenv').config();

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads-test';

function getTestDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL;
  }
  const base = process.env.DATABASE_URL || '';
  if (base.includes('_test')) return base;
  return base.replace(/\/([^/?]+)(\?.*)?$/, '/$1_test$2');
}

process.env.DATABASE_URL = getTestDatabaseUrl();
