#!/usr/bin/env node
/**
 * Create DATA_SOURCE calculation jobs for ALL data sources in the GRC API.
 *
 * For each data source it POSTs to {base}/calculations/jobs with:
 *   { calculation_level, date_from, date_to, data_source_slug, indicator_slug }
 *
 * Usage:
 *   npm run jobs:create -- --from 2025-01-01 --to 2025-12-31
 *   GRC_TOKEN=<jwt> npm run jobs:create -- --from 2025-01-01 --to 2025-12-31 --limit 50 --dry-run
 *
 * Args:
 *   --from   date_from (YYYY-MM-DD) [required]
 *   --to     date_to   (YYYY-MM-DD) [required]
 *   --token  Bearer JWT (falls back to GRC_TOKEN env)
 *   --limit  page size for fetching data sources (default 50)
 *   --concurrency max parallel job creations (default 5)
 *   --dry-run  print payloads without sending requests
 *   --base   GRC base URL (default http://localhost:3000/api/v1, env GRC_BASE_URL)
 */

import { setTimeout as sleep } from 'node:timers/promises';

const args = process.argv.slice(2);

function argValue(name, fallback) {
  const idx = args.findIndex((a) => a === `--${name}`);
  if (idx === -1) return fallback;
  const val = args[idx + 1];
  return val === undefined ? '' : val;
}

const dateFrom = argValue('from', '');
const dateTo = argValue('to', '');
const token = argValue('token', process.env.GRC_TOKEN ?? '');
const pageSize = Number(argValue('limit', '50')) || 50;
const concurrency = Number(argValue('concurrency', '5')) || 5;
const dryRun = args.includes('--dry-run');
const baseUrl = (argValue('base', process.env.GRC_BASE_URL ?? 'http://localhost:3000/api/v1')).replace(/\/+$/, '');

if (!dateFrom || !dateTo) {
  console.error('Usage: npm run jobs:create -- --from YYYY-MM-DD --to YYYY-MM-DD [--token <jwt>] [--dry-run]');
  process.exit(1);
}

if (!token) {
  console.error('Missing token: pass --token <jwt> or set the GRC_TOKEN env var.');
  process.exit(1);
}

const headers = {
  Accept: 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
};

async function api(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers,
    ...options,
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const err = body && typeof body === 'object'
      ? JSON.stringify(body.error ?? body).slice(0, 400)
      : String(body).slice(0, 400);
    throw new Error(`${res.status} ${res.statusText} ${err}`);
  }
  return body;
}

async function fetchAllDataSources() {
  const all = [];
  let page = 1;
  for (;;) {
    const res = await api(`/context/data-sources?page=${page}&limit=${pageSize}`);
    const list = Array.isArray(res?.data?.list) ? res.data.list : [];
    const count = Number(res?.data?.paginator?.count ?? 0);
    all.push(...list);
    console.log(`[data-sources] page ${page}: fetched ${list.length} (total ${count})`);
    if (list.length === 0 || all.length >= count || page >= 100) break;
    page += 1;
  }
  return all;
}

async function createJob(item) {
  const payload = {
    calculation_level: 'DATA_SOURCE',
    date_from: dateFrom,
    date_to: dateTo,
    data_source_slug: item.slug,
  };
  if (item.indicatorSlug) payload.indicator_slug = item.indicatorSlug;

  if (dryRun) {
    console.log(`[dry-run] ${item.slug} ->`, JSON.stringify(payload));
    return { slug: item.slug, dry: true };
  }

  const res = await api('/calculations/jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res?.result !== true) {
    const msg = Array.isArray(res?.error) && res.error.length ? res.error.join('; ') : 'unknown error';
    throw new Error(msg);
  }
  return { slug: item.slug, result: res };
}

async function runPool(items) {
  const results = { ok: 0, failed: 0, dry: 0 };
  let cursor = 0;
  const failures = [];

  async function worker() {
    for (;;) {
      const idx = cursor;
      cursor += 1;
      if (idx >= items.length) return;
      const item = items[idx];
      try {
        const r = await createJob(item);
        if (r.dry) results.dry += 1;
        else results.ok += 1;
        console.log(`[ok] ${item.slug}${r.dry ? ' (dry-run)' : ''}`);
      } catch (err) {
        results.failed += 1;
        failures.push({ slug: item.slug, error: err.message });
        console.error(`[fail] ${item.slug} -> ${err.message}`);
      }
      await sleep(50);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length || 1) }, worker));
  return { results, failures };
}

console.log(`\nCreating DATA_SOURCE calculation jobs for date range ${dateFrom} .. ${dateTo}`);
console.log(`Base: ${baseUrl} | page size: ${pageSize} | concurrency: ${concurrency}${dryRun ? ' | DRY RUN' : ''}\n`);

const dataSources = await fetchAllDataSources();
console.log(`\nTotal data sources: ${dataSources.length}\n`);

if (dataSources.length === 0) {
  console.log('No data sources found. Nothing to do.');
  process.exit(0);
}

const { results, failures } = await runPool(dataSources);

console.log('\n=== Summary ===');
console.log(`Total data sources : ${dataSources.length}`);
console.log(`Created jobs       : ${results.ok}`);
console.log(`Dry-run            : ${results.dry}`);
console.log(`Failed             : ${results.failed}`);

if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f.slug}: ${f.error}`);
}

process.exit(results.failed > 0 ? 1 : 0);
