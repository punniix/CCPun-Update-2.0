import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const builder = await readFile(new URL('../scripts/backup/build-content-media-mirror-v2.mjs', import.meta.url), 'utf8');
const sync = await readFile(new URL('../scripts/backup/sync-content-media-mirror-to-drive.mjs', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/mirror-content-media.yml', import.meta.url), 'utf8');

assert.match(builder, /const PROJECT_ID = 'kyfxgjnq'/);
assert.match(builder, /const DATASET = 'production'/);
assert.match(builder, /perspective: 'raw'/);
assert.match(builder, /parsed\.hostname !== 'cdn\.sanity\.io'/);
assert.match(builder, /MAX_MEDIA_BYTES = 25 \* 1024 \* 1024/);
assert.match(builder, /markdownPath: posixRelative\(articleDir, outputPath\)/);
assert.match(builder, /schemaVersion: 2/);
assert.doesNotMatch(builder, /process\.env\.(?!SANITY_AUTH_TOKEN|SANITY_PROJECT_ID|SANITY_DATASET|MIRROR_ROOT)[A-Z0-9_]*TOKEN/);

assert.match(sync, /CONTENT_FOLDER_ID = '1NgXE5MAi6VYzI74POcikJH_MCpyBDwad'/);
assert.match(sync, /MEDIA_FOLDER_ID = '1PVl4yvJ8rHAqQf_jwVUogEvewwMsQq-o'/);
assert.match(sync, /upsert-only; no Drive deletions/);
assert.doesNotMatch(sync, /method:\s*'DELETE'/);
assert.doesNotMatch(sync, /\/drive\/v3\/files\/[^`]*\?[^`]*trashed=true/);

assert.match(workflow, /cron: '30 19 \* \* \*'/);
assert.match(workflow, /secrets\.SANITY_BACKUP_READ_TOKEN/);
assert.match(workflow, /secrets\.GOOGLE_BACKUP_SERVICE_ACCOUNT_JSON/);
assert.match(workflow, /build-content-media-mirror-v2\.mjs/);
assert.match(workflow, /sync-content-media-mirror-to-drive\.mjs/);
assert.doesNotMatch(workflow, /v4-production|vercel --prod|sanity.*delete/i);

console.log('content/media mirror regression checks passed');
