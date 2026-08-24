import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { getGoogleAccessToken, parseServiceAccount } from './google-service-account.mjs';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function escapeDriveQuery(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'");
}

function mimeTypeFor(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  return new Map([
    ['.md', 'text/markdown'],
    ['.json', 'application/json'],
    ['.txt', 'text/plain'],
    ['.html', 'text/html'],
    ['.webp', 'image/webp'],
    ['.png', 'image/png'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.gif', 'image/gif'],
    ['.avif', 'image/avif'],
    ['.svg', 'image/svg+xml'],
    ['.pdf', 'application/pdf'],
  ]).get(extension) ?? 'application/octet-stream';
}

async function googleRequest(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = null; }
  if (!response.ok) {
    const message = body?.error?.message ?? `${response.status} ${response.statusText}`;
    throw new Error(`Google Drive request failed: ${message}`);
  }
  return body;
}

async function findExactChildren(token, parentId, name, mimeType = null) {
  const mimeFilter = mimeType ? ` and mimeType='${escapeDriveQuery(mimeType)}'` : '';
  const params = new URLSearchParams({
    q: `'${escapeDriveQuery(parentId)}' in parents and name='${escapeDriveQuery(name)}'${mimeFilter} and trashed=false`,
    fields: 'files(id,name,mimeType,size,modifiedTime)',
    pageSize: '100',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });
  const body = await googleRequest(`https://www.googleapis.com/drive/v3/files?${params}`, token);
  return body?.files ?? [];
}

async function ensureFolder(token, parentId, name) {
  const folderMime = 'application/vnd.google-apps.folder';
  const matches = await findExactChildren(token, parentId, name);
  const folders = matches.filter((item) => item.mimeType === folderMime);
  const nonFolders = matches.filter((item) => item.mimeType !== folderMime);
  if (nonFolders.length) throw new Error(`Drive name collision: ${name} already exists as a file`);
  if (folders.length > 1) throw new Error(`Ambiguous duplicate Drive folder: ${name}`);
  if (folders.length === 1) return { id: folders[0].id, created: false };
  const body = await googleRequest('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,name,mimeType', token, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, mimeType: folderMime, parents: [parentId] }),
  });
  if (!body?.id) throw new Error(`Drive folder create returned no id: ${name}`);
  return { id: body.id, created: true };
}

async function uploadFile(token, parentId, localPath, fileName) {
  const mimeType = mimeTypeFor(fileName);
  const matches = await findExactChildren(token, parentId, fileName);
  if (matches.some((item) => item.mimeType === 'application/vnd.google-apps.folder')) {
    throw new Error(`Drive name collision: ${fileName} already exists as a folder`);
  }
  if (matches.length > 1) throw new Error(`Ambiguous duplicate Drive file: ${fileName}`);
  const buffer = await readFile(localPath);
  if (!buffer.length) throw new Error(`Refusing to sync empty file: ${localPath}`);
  const boundary = `ccpun-mirror-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const existing = matches[0] ?? null;
  const metadata = existing ? { name: fileName, mimeType } : { name: fileName, mimeType, parents: [parentId] };
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const base = existing
    ? `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existing.id)}`
    : 'https://www.googleapis.com/upload/drive/v3/files';
  const url = `${base}?uploadType=multipart&supportsAllDrives=true&fields=id,name,size,mimeType`;
  const result = await googleRequest(url, token, {
    method: existing ? 'PATCH' : 'POST',
    headers: {
      'content-type': `multipart/related; boundary=${boundary}`,
      'content-length': String(body.length),
    },
    body,
  });
  if (!result?.id) throw new Error(`Drive upload returned no id: ${fileName}`);
  if (Number(result.size) !== buffer.length) throw new Error(`Drive upload size mismatch: ${fileName}`);
  return { id: result.id, bytes: buffer.length, created: !existing };
}

async function syncDirectory(token, localDir, parentId, counters) {
  const entries = await readdir(localDir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.isSymbolicLink()) throw new Error(`Refusing symlink in mirror: ${path.join(localDir, entry.name)}`);
    const absolute = path.join(localDir, entry.name);
    if (entry.isDirectory()) {
      const folder = await ensureFolder(token, parentId, entry.name);
      counters.folders += 1;
      if (folder.created) counters.createdFolders += 1;
      await syncDirectory(token, absolute, folder.id, counters);
      continue;
    }
    if (!entry.isFile()) throw new Error(`Unsupported filesystem entry in mirror: ${absolute}`);
    const info = await stat(absolute);
    if (info.size <= 0) throw new Error(`Refusing empty mirror file: ${absolute}`);
    const uploaded = await uploadFile(token, parentId, absolute, entry.name);
    counters.files += 1;
    counters.bytes += uploaded.bytes;
    if (uploaded.created) counters.createdFiles += 1;
    else counters.updatedFiles += 1;
  }
}

async function main() {
  const localDir = path.resolve(required('LOCAL_DIR'));
  const rootFolderId = required('GOOGLE_DRIVE_ROOT_FOLDER_ID');
  const info = await stat(localDir);
  if (!info.isDirectory()) throw new Error(`LOCAL_DIR is not a directory: ${localDir}`);

  const account = parseServiceAccount(required('GOOGLE_BACKUP_SERVICE_ACCOUNT_JSON'));
  const token = await getGoogleAccessToken(account, ['https://www.googleapis.com/auth/drive']);
  const counters = { folders: 0, createdFolders: 0, files: 0, createdFiles: 0, updatedFiles: 0, bytes: 0 };
  await syncDirectory(token, localDir, rootFolderId, counters);
  console.log(JSON.stringify({ mode: 'upsert-only', rootFolderId, ...counters }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Drive mirror sync failed');
  process.exitCode = 1;
});
