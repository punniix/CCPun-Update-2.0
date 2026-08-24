import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@sanity/client';

const TARGET_PROJECT_ID = 'ccb9lnw5';
const TARGET_DATASET = 'recovery';
const token = process.env.SANITY_AUTH_TOKEN?.trim();
const manifestPath = path.resolve(process.env.BACKUP_MANIFEST_FILE?.trim() || '');
const reportPath = path.resolve(process.env.RECOVERY_REPORT_FILE?.trim() || '.ccpun-recovery-report.json');

if (!token) throw new Error('SANITY_AUTH_TOKEN is required for recovery verification');
if (!process.env.BACKUP_MANIFEST_FILE?.trim()) throw new Error('BACKUP_MANIFEST_FILE is required');
if ((process.env.SANITY_PROJECT_ID?.trim() || TARGET_PROJECT_ID) !== TARGET_PROJECT_ID) throw new Error('Recovery verification is pinned to ccb9lnw5');
if ((process.env.SANITY_DATASET?.trim() || TARGET_DATASET) !== TARGET_DATASET) throw new Error('Recovery verification is pinned to recovery');

let manifest;
try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { throw new Error('Recovery manifest is unreadable'); }
if (manifest?.schemaVersion !== 2 || !manifest?.stats) throw new Error('Recovery manifest is not verifiable');

const client = createClient({
  projectId: TARGET_PROJECT_ID,
  dataset: TARGET_DATASET,
  token,
  apiVersion: '2026-08-24',
  useCdn: false,
  perspective: 'raw',
});
const documents = await client.fetch(`*[]{_id,_type}`);
if (!Array.isArray(documents)) throw new Error('Recovery dataset query did not return a document array');

const nonSystem = documents.filter((document) => typeof document?._id === 'string' && !document._id.startsWith('_.'));
const typeCounts = {};
for (const document of nonSystem) {
  const type = String(document?._type || 'unknown');
  typeCounts[type] = (typeCounts[type] ?? 0) + 1;
}
const actual = {
  totalNonSystem: nonSystem.length,
  drafts: nonSystem.filter((document) => document._id.startsWith('drafts.')).length,
  nonDrafts: nonSystem.filter((document) => !document._id.startsWith('drafts.')).length,
  imageAssets: typeCounts['sanity.imageAsset'] ?? 0,
  fileAssets: typeCounts['sanity.fileAsset'] ?? 0,
  typeCounts: Object.fromEntries(Object.entries(typeCounts).sort(([a], [b]) => a.localeCompare(b))),
};

const expected = manifest.stats;
const differences = [];
for (const key of ['totalNonSystem', 'drafts', 'nonDrafts', 'imageAssets', 'fileAssets']) {
  if (Number(actual[key]) !== Number(expected[key])) differences.push(`${key}: expected ${expected[key]}, got ${actual[key]}`);
}
const typeNames = [...new Set([...Object.keys(expected.typeCounts ?? {}), ...Object.keys(actual.typeCounts ?? {})])].sort();
for (const type of typeNames) {
  const expectedCount = Number(expected.typeCounts?.[type] ?? 0);
  const actualCount = Number(actual.typeCounts?.[type] ?? 0);
  if (expectedCount !== actualCount) differences.push(`type ${type}: expected ${expectedCount}, got ${actualCount}`);
}

const report = {
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  snapshotId: manifest.snapshotId,
  source: manifest.sanity,
  target: { projectId: TARGET_PROJECT_ID, dataset: TARGET_DATASET },
  result: differences.length ? 'FAIL' : 'PASS',
  expected,
  actual,
  differences,
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });

if (differences.length) {
  console.error(JSON.stringify({ snapshotId: manifest.snapshotId, result: 'FAIL', differences }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ snapshotId: manifest.snapshotId, result: 'PASS', ...actual }, null, 2));
}
