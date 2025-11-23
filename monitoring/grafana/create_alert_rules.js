#!/usr/bin/env node
/*
  Script to create alert rules in Grafana via HTTP API.
  Usage:
    export GRAFANA_URL=http://localhost:3000
    export GRAFANA_API_KEY=eyJr... (Admin role)
    node monitoring/grafana/create_alert_rules.js

  The script will:
  - create a folder 'Fastfood Delivery' (uid: fastfood-delivery)
  - lookup Prometheus datasource UID by name 'Prometheus'
  - create three alert rules: Service down, High 5xx error rate, High P95 latency

  NOTE: Grafana API formats may vary between versions. This script uses the unified alerting /api/v1/rules endpoint.
*/

import fetch from 'node-fetch';
import process from 'process';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

const GRAFANA_URL = process.env.GRAFANA_URL || 'http://localhost:3000';
let headers; // will be initialized in main() after obtaining API key

async function createFolder() {
  const uid = 'fastfood-delivery';
  const title = 'Fastfood Delivery';
  const url = `${GRAFANA_URL}/api/folders`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ uid, title }),
    });
    if (res.status === 412) {
      console.log('Folder already exists:', uid);
      return uid;
    }
    if (!res.ok) {
      const body = await res.text();
      console.error('Failed to create folder', res.status, body);
      return null;
    }
    console.log('Created folder:', uid);
    return uid;
  } catch (err) {
    console.error('Error creating folder', err.message);
    return null;
  }
}

async function findDatasourceUid(name = 'Prometheus') {
  const url = `${GRAFANA_URL}/api/datasources/name/${encodeURIComponent(name)}`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error('Failed to find datasource', name, res.status);
      return null;
    }
    const obj = await res.json();
    return obj.uid;
  } catch (err) {
    console.error('Error finding datasource', err.message);
    return null;
  }
}

async function createRule(folderUid, rulePayload) {
  const url = `${GRAFANA_URL}/api/v1/rules`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(rulePayload),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error('Failed to create rule', rulePayload.title, res.status, text);
      return false;
    }
    console.log('Created rule:', rulePayload.title);
    return true;
  } catch (err) {
    console.error('Error creating rule', rulePayload.title, err.message);
    return false;
  }
}

function buildPromQueryModel(expr, datasourceUid) {
  return {
    datasource: { uid: datasourceUid, type: 'prometheus' },
    expr,
    interval: '',
    legendFormat: '',
    refId: 'A',
  };
}

async function main() {
  console.log('Grafana URL:', GRAFANA_URL);
  // Obtain API key: env var OR CLI arg (--api-key or -k) OR prompt
  let API_KEY = process.env.GRAFANA_API_KEY;
  if (!API_KEY) {
    const argIndex = process.argv.findIndex(a => a === '--api-key' || a === '-k');
    if (argIndex !== -1 && process.argv[argIndex + 1]) {
      API_KEY = process.argv[argIndex + 1];
    }
  }
  if (!API_KEY) {
    const rl = readline.createInterface({ input, output });
    API_KEY = await rl.question('Enter Grafana API Key (will be hidden in CI recommended): ');
    rl.close();
  }
  if (!API_KEY) {
    console.error('Error: Grafana API key not provided via env, --api-key or prompt');
    process.exit(1);
  }

  headers = {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };

  const folderUid = await createFolder();
  if (!folderUid) process.exit(1);

  const dsUid = await findDatasourceUid('Prometheus');
  if (!dsUid) {
    console.error('Prometheus datasource not found. Make sure datasource named "Prometheus" exists.');
    process.exit(1);
  }

  // 1) Service down alert
  const serviceDownExpr = 'up{job=~".*-service"}';
  const serviceDownRule = {
    title: 'Service down (up == 0)',
    folderUid,
    rule: {
      title: 'Service down (up == 0)',
      condition: 'A',
      data: [buildPromQueryModel(serviceDownExpr, dsUid)],
      for: '1m',
      labels: { project: 'fastfood_delivery' },
      annotations: {
        summary: 'Service {{ $labels.job }} is DOWN',
        description: 'Prometheus target up=0 more than 1 minute',
      },
    },
  };

  // 2) High 5xx error rate
  const err5xxExpr = '100 * sum by (service) (rate(http_request_duration_ms_count{project="fastfood_delivery", status_code=~"5.."}[5m])) / sum by (service) (rate(http_request_duration_ms_count{project="fastfood_delivery"}[5m]))';
  const err5xxRule = {
    title: 'High 5xx error rate (>5%)',
    folderUid,
    rule: {
      title: 'High 5xx error rate (>5%)',
      condition: 'A',
      data: [buildPromQueryModel(err5xxExpr, dsUid)],
      for: '5m',
      labels: { project: 'fastfood_delivery' },
      annotations: {
        summary: 'High error rate on {{ $labels.service }}',
        description: '5xx error rate > 5% for last 5m',
      },
    },
  };

  // 3) High P95 latency
  const p95Expr = 'histogram_quantile(0.95, sum by (service, le) (rate(http_request_duration_ms_bucket{project="fastfood_delivery"}[5m])))';
  const p95Rule = {
    title: 'High latency P95 (>1s)',
    folderUid,
    rule: {
      title: 'High latency P95 (>1s)',
      condition: 'A',
      data: [buildPromQueryModel(p95Expr, dsUid)],
      for: '5m',
      labels: { project: 'fastfood_delivery' },
      annotations: {
        summary: 'High latency on {{ $labels.service }}',
        description: 'P95 latency > 1s for last 5m',
      },
    },
  };

  // Create rules
  console.log('Creating Service down rule...');
  await createRule(folderUid, serviceDownRule);
  console.log('Creating High 5xx rule...');
  await createRule(folderUid, err5xxRule);
  console.log('Creating High P95 rule...');
  await createRule(folderUid, p95Rule);

  console.log('Done. Open Grafana -> Alerting -> Alert rules to review.');
}

main();
