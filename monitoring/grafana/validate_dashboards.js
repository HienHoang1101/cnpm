#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || path.join(__dirname, 'dashboards');

function isJsonFile(file) {
  return file.toLowerCase().endsWith('.json');
}

async function findJsonFiles(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) return findJsonFiles(res);
    if (entry.isFile() && isJsonFile(entry.name)) return [res];
    return [];
  }));
  return Array.prototype.concat(...files);
}

async function validateFile(file) {
  try {
    const raw = await fs.promises.readFile(file, 'utf8');
    const json = JSON.parse(raw);
    const uid = json.uid;
    const title = json.title;
    const okUid = typeof uid === 'string' && uid.trim().length > 0;
    const okTitle = typeof title === 'string' && title.trim().length > 0;
    if (!okUid || !okTitle) {
      return { file, ok: false, reason: 'missing uid or title', uid, title };
    }
    return { file, ok: true, uid, title };
  } catch (err) {
    return { file, ok: false, reason: err.message };
  }
}

async function main() {
  try {
    const stats = await fs.promises.stat(root);
    if (!stats.isDirectory()) {
      console.error('Provided dashboards path is not a directory:', root);
      process.exit(2);
    }
  } catch (err) {
    console.error('Dashboards path not found:', root);
    process.exit(2);
  }

  const files = await findJsonFiles(root);
  if (files.length === 0) {
    console.log('No JSON dashboard files found under', root);
    process.exit(0);
  }

  let errors = 0;
  for (const f of files) {
    const res = await validateFile(f);
    if (res.ok) {
      console.log(`OK: ${f} (uid=${res.uid} title=${res.title})`);
    } else {
      console.error(`ERROR: ${f} -> ${res.reason}` + (res.uid || res.title ? ` (uid=${res.uid} title=${res.title})` : ''));
      errors++;
    }
  }

  if (errors > 0) {
    console.error(`Found ${errors} dashboard validation error(s)`);
    process.exit(1);
  }
  console.log('All dashboards validated successfully.');
  process.exit(0);
}

main();
