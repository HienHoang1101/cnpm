const { test } = require('node:test');
const assert = require('node:assert');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const envPath = path.resolve(process.cwd(), '../.env.example');
const envExample = readFileSync(envPath, 'utf-8');

const requiredKeys = ['MONGO_URI_Delivery', 'PORT_Delivery', 'EXPO_PUBLIC_DELIVERY_API_URL'];

test('delivery service env.example contains required keys', () => {
  for (const key of requiredKeys) {
    assert.ok(envExample.includes(`${key}=`), `Missing ${key} in .env.example`);
  }
});
