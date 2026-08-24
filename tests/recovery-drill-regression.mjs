import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const workflow = read('.github/workflows/recovery-drill.yml');
const downloader = read('scripts/backup/download-verified-drive-backup.mjs');
const verifier = read('scripts/backup/verify-recovery-dataset.mjs');
const recorder = read('scripts/backup/record-recovery-check.mjs');
const stats = read('scripts/backup/collect-sanity-backup-stats.mjs');
const uploader = read('scripts/backup/upload-sanity-backup-to-drive.mjs');
const backupWorkflow = read('.github/workflows/backup-sanity-production.yml');

assert.match(workflow, /RESET-CCPUN-RECOVERY/);
assert.match(workflow, /RECOVERY_PROJECT_ID:\s*ccb9lnw5/);
assert.match(workflow, /RECOVERY_DATASET:\s*recovery/);
assert.match(workflow, /SANITY_RECOVERY_ADMIN_TOKEN/);
assert.match(workflow, /datasets delete recovery --project-id ccb9lnw5 --force/);
assert.match(workflow, /datasets create recovery --project-id ccb9lnw5 --visibility private/);
assert.match(workflow, /datasets import[\s\S]*recovery[\s\S]*--project-id ccb9lnw5[\s\S]*--replace[\s\S]*--allow-assets-in-different-dataset/);
assert.doesNotMatch(workflow, /datasets (delete|create|import) (production|uat)\b/);
assert.doesNotMatch(workflow, /--skip-cross-dataset-references/, 'Recovery drill should fail on unexpected cross-dataset references instead of silently skipping them');
assert.match(workflow, /Download and verify selected CCPun Production backup[\s\S]*Reset isolated private recovery dataset only/);

assert.match(downloader, /PRODUCTION_BACKUP_FOLDER_ID = '17OTY--nrou3JjcKeDjl2OLg95n1CpdA2'/);
assert.match(downloader, /SOURCE_PROJECT_ID = 'kyfxgjnq'/);
assert.match(downloader, /SOURCE_DATASET = 'production'/);
assert.match(downloader, /manifest\?\.archive\?\.sha256/);
assert.match(downloader, /Downloaded backup SHA-256 does not match manifest/);
assert.match(downloader, /schemaVersion !== 2/);
assert.match(downloader, /outside the approved CCPun Production backup folder/);

assert.match(verifier, /TARGET_PROJECT_ID = 'ccb9lnw5'/);
assert.match(verifier, /TARGET_DATASET = 'recovery'/);
assert.match(verifier, /typeCounts/);
assert.match(verifier, /imageAssets/);
assert.match(verifier, /fileAssets/);
assert.match(verifier, /result: differences\.length \? 'FAIL' : 'PASS'/);

assert.match(recorder, /Only PASS recovery reports may be recorded/);
assert.match(recorder, /ccb9lnw5/);
assert.match(recorder, /dataset !== 'recovery'/);
assert.match(recorder, /Recovery Checks/);
assert.match(recorder, /RECOVERY_EVIDENCE_FOLDER_ID = '1p-GbTDMzRndYLMz13xqfgBx7JWs17_kV'/);

assert.match(stats, /PROJECT_ID = 'kyfxgjnq'/);
assert.match(stats, /DATASET = 'production'/);
assert.match(stats, /totalNonSystem/);
assert.match(stats, /drafts/);
assert.match(stats, /sanity\.imageAsset/);
assert.match(stats, /sanity\.fileAsset/);
assert.match(uploader, /schemaVersion: 2/);
assert.match(uploader, /stats,/);
assert.match(backupWorkflow, /Capture source counts for restore verification/);
assert.match(backupWorkflow, /BACKUP_STATS_FILE/);

console.log('PASS: recovery drill regression');
