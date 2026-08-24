import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const workflow = read('.github/workflows/backup-sanity-production.yml');
const uploader = read('scripts/backup/upload-sanity-backup-to-drive.mjs');
const auth = read('scripts/backup/google-service-account.mjs');
const docs = read('scripts/backup/README.md');

assert.match(workflow, /cron:\s*'0 19 \* \* \*'/);
assert.match(workflow, /SANITY_PROJECT_ID:\s*kyfxgjnq/);
assert.match(workflow, /SANITY_DATASET:\s*production/);
assert.match(workflow, /SANITY_BACKUP_READ_TOKEN/);
assert.match(workflow, /GOOGLE_BACKUP_SERVICE_ACCOUNT_JSON/);
assert.match(workflow, /datasets export production/);
assert.doesNotMatch(workflow, /--no-assets|--no-drafts|--no-strict-asset-verification/);
assert.match(workflow, /retention-days:\s*7/);
assert.doesNotMatch(workflow, /vercel|cron\.json/i, 'Backup orchestration must stay independent from Vercel');

assert.match(uploader, /sha256/);
assert.match(uploader, /PENDING RESTORE TEST/);
assert.match(uploader, /Drive archive/);
assert.match(uploader, /Backup Registry append/);
assert.doesNotMatch(uploader, /console\.log\([^\n]*(private_key|access_token|SANITY_AUTH_TOKEN)/i);
assert.match(auth, /RSA-SHA256/);
assert.doesNotMatch(auth, /console\.log|console\.error/);
assert.match(docs, /restore has been tested/i);
assert.match(docs, /must never target Production/i);

console.log('PASS: backup regression');
