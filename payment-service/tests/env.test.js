import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '../.env.example');
const envExample = readFileSync(envPath, 'utf-8');

const requiredKeys = [
  'PAYHERE_MERCHANT_ID',
  'PAYHERE_SECRET',
  'PAYHERE_BASE_URL',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_SECRET_KEY',
  'AUTH_SERVICE_URL',
  'RESTAURANT_SERVICE_URL',
  'ORDER_SERVICE_URL',
];

test('payment-service env.example contains required keys', () => {
  for (const key of requiredKeys) {
    assert.ok(
      envExample.includes(`${key}=`),
      `Missing ${key} in .env.example`
    );
  }
});
