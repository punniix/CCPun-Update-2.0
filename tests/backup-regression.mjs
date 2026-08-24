import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const workflow = read('.github/workflows/backup-sanity-production.yml');
const uploader = read('scripts/backup/upload-sanity-backup-to-drive.mjs');
const auth = read('scripts/backup/google-service-account.mjs');
const mirror = read('scripts/backup/build-content-media-mirror.mjs');
const driveSync = read('scripts/backup/sync-directory-to-drive.mjs');
const docs = read('scripts/backup/README.md');

assert.match(workflow, /cron:\s*'0 19 \* \* \*'/);
assert.match(workflow, /SANITY_PROJECT_ID:\s*kyfxgjnq/);
assert.match(workflow, /SANITY_DATASET:\s*production/);
assert.match(workflow, /SANITY_BACKUP_READ_TOKEN/);
assert.match(workflow, /GOOGLE_BACKUP_SERVICE_ACCOUNT_JSON/);
assert.match(workflow, /datasets export production/);
assert.doesNotMatch(workflow, /--no-assets|--no-drafts|--no-strict-asset-verification/);
assert.match(workflow, /retention-days:\s*7/);
assert.match(workflow, /Build current readable Blog and media mirror/);
assert.match(workflow, /GOOGLE_DRIVE_CONTENT_FOLDER_ID:\s*1NgXE5MAi6VYzI74POcikJH_MCpyBDwad/);
assert.match(workflow, /GOOGLE_DRIVE_MEDIA_FOLDER_ID:\s*1PVl4yvJ8rHAqQf_jwVUogEvewwMsQq-o/);
assert.doesNotMatch(workflow, /vercel|cron\.json/i, 'Backup orchestration must stay independent from Vercel');

assert.match(uploader, /sha256/);
assert.match(uploader, /PENDING RESTORE TEST/);
assert.match(uploader, /Drive archive/);
assert.match(uploader, /Backup Registry append/);
assert.doesNotMatch(uploader, /console\.log\([^\n]*(private_key|access_token|SANITY_AUTH_TOKEN)/i);
assert.match(auth, /RSA-SHA256/);
assert.doesNotMatch(auth, /console\.log|console\.error/);

assert.match(mirror, /Mirror is pinned to kyfxgjnq\/production/);
assert.match(mirror, /article\.json/);
assert.match(mirror, /article\.md/);
assert.match(mirror, /sha256/);
assert.match(mirror, /MAX_MEDIA_BYTES/);
assert.match(mirror, /posixRelative\(articleDir, mirrored\.outputPath\)/);
assert.match(mirror, /path:\s*posixRelative\(root, mirrored\.outputPath\)/);
assert.doesNotMatch(mirror, /relativePath:\s*path\.relative\(contentRoot/);

assert.match(driveSync, /mode:\s*'upsert-only'/);
assert.match(driveSync, /PATCH/);
assert.match(driveSync, /POST/);
assert.match(driveSync, /Refusing symlink in mirror/);
assert.match(driveSync, /Ambiguous duplicate Drive file/);
assert.match(driveSync, /Drive name collision/);
assert.doesNotMatch(driveSync, /method:\s*['"]DELETE['"]|\/trash|trashed:\s*true/i, 'Mirror sync must never delete or trash Drive files');
assert.doesNotMatch(driveSync, /console\.log\([^\n]*(private_key|access_token)/i);

assert.match(docs, /restore has been tested/i);
assert.match(docs, /must never target Production/i);

console.log('PASS: backup regression');
