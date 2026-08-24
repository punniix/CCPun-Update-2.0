import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { getGoogleAccessToken, parseServiceAccount } from './google-service-account.mjs';

const PRODUCTION_BACKUP_FOLDER_ID = '17OTY--nrou3JjcKeDjl2OLg95n1CpdA2';
const SOURCE_PROJECT_ID = 'kyfxgjnq';
const SOURCE_DATASET = 'production';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}
function escapeDriveQuery(value) { return String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'"); }

async function googleJson(url, token) {
  const response = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Google Drive metadata request failed (${response.status})`);
  return response.json();
}

async function metadata(token, fileId) {
  return googleJson(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true&fields=id,name,size,mimeType,parents,trashed`, token);
}

async function findManifest(token, archiveName) {
  const manifestName = `${archiveName}.manifest.json`;
  const params = new URLSearchParams({
    q: `'${escapeDriveQuery(PRODUCTION_BACKUP_FOLDER_ID)}' in parents and name='${escapeDriveQuery(manifestName)}' and trashed=false`,
    fields: 'files(id,name,size,mimeType,parents)',
    pageSize: '100',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });
  const body = await googleJson(`https://www.googleapis.com/drive/v3/files?${params}`, token);
  const files = body?.files ?? [];
  if (files.length !== 1) throw new Error(`Expected exactly one backup manifest for ${archiveName}; found ${files.length}`);
  return files[0];
}

async function downloadJson(token, fileId) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Google Drive manifest download failed (${response.status})`);
  const text = await response.text();
  try { return JSON.parse(text); } catch { throw new Error('Backup manifest is invalid JSON'); }
}

async function downloadArchive(token, fileId, outputPath) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok || !response.body) throw new Error(`Google Drive archive download failed (${response.status})`);
  const hash = createHash('sha256');
  let bytes = 0;
  const verifier = new Transform({
    transform(chunk, encoding, callback) {
      bytes += chunk.length;
      hash.update(chunk);
      callback(null, chunk);
    },
  });
  await pipeline(Readable.fromWeb(response.body), verifier, createWriteStream(outputPath, { mode: 0o600 }));
  return { bytes, sha256: hash.digest('hex') };
}

async function githubOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  const { appendFile } = await import('node:fs/promises');
  await appendFile(process.env.GITHUB_OUTPUT, `${name}=${String(value).replaceAll('\n', ' ')}\n`);
}

async function main() {
  const archiveFileId = required('BACKUP_DRIVE_FILE_ID');
  const outputPath = path.resolve(required('BACKUP_FILE'));
  const serviceAccount = parseServiceAccount(required('GOOGLE_BACKUP_SERVICE_ACCOUNT_JSON'));
  const token = await getGoogleAccessToken(serviceAccount, ['https://www.googleapis.com/auth/drive.readonly']);

  const archive = await metadata(token, archiveFileId);
  if (archive?.trashed) throw new Error('Selected backup archive is trashed');
  if (!archive?.name?.endsWith('.tar.gz')) throw new Error('Selected Drive file is not a .tar.gz Sanity backup');
  if (!Array.isArray(archive.parents) || !archive.parents.includes(PRODUCTION_BACKUP_FOLDER_ID)) {
    throw new Error('Selected backup is outside the approved CCPun Production backup folder');
  }
  if (!Number.isFinite(Number(archive.size)) || Number(archive.size) <= 0) throw new Error('Selected backup has invalid size metadata');

  const manifestMeta = await findManifest(token, archive.name);
  const manifest = await downloadJson(token, manifestMeta.id);
  if (manifest?.schemaVersion !== 2) throw new Error('Backup manifest schema is not recovery-verifiable');
  if (manifest?.sanity?.projectId !== SOURCE_PROJECT_ID || manifest?.sanity?.dataset !== SOURCE_DATASET) {
    throw new Error('Backup manifest source is not CCPun Production');
  }
  if (manifest?.archive?.fileName !== archive.name) throw new Error('Backup manifest filename does not match selected archive');
  if (!manifest?.stats || typeof manifest.stats !== 'object') throw new Error('Backup manifest is missing source stats');

  const downloaded = await downloadArchive(token, archive.id, outputPath);
  if (downloaded.bytes !== Number(archive.size) || downloaded.bytes !== Number(manifest?.archive?.bytes)) {
    throw new Error('Downloaded backup size does not match Drive/manifest metadata');
  }
  if (downloaded.sha256 !== manifest?.archive?.sha256) throw new Error('Downloaded backup SHA-256 does not match manifest');

  const manifestPath = `${outputPath}.manifest.json`;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  const reread = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (reread.snapshotId !== manifest.snapshotId) throw new Error('Local manifest verification failed');

  await githubOutput('snapshot_id', manifest.snapshotId);
  await githubOutput('manifest_file', manifestPath);
  await githubOutput('archive_sha256', downloaded.sha256);
  console.log(JSON.stringify({ snapshotId: manifest.snapshotId, archive: archive.name, bytes: downloaded.bytes, sha256: downloaded.sha256 }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Verified backup download failed');
  process.exitCode = 1;
});
