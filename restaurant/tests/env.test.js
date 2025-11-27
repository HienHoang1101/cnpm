import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '../.env.example');
const envExample = readFileSync(envPath, 'utf-8');

const requiredKeys = ['MONGO_URI_Restaurant', 'PORT_Restaurant', 'RESTAURANT_SERVICE_URL'];

test('restaurant env.example contains required keys', () => {
  for (const key of requiredKeys) {
    assert.ok(envExample.includes(`${key}=`), `Missing ${key} in .env.example`);
  }
});
