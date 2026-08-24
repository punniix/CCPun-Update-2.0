import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getGoogleAccessToken, parseServiceAccount } from './google-service-account.mjs';

const REGISTRY_SHEET_ID = '12hwLk83xxergE9pmf_5JJICmTuti3FhWiHlPA3ebvpU';
const RECOVERY_EVIDENCE_FOLDER_ID = '1p-GbTDMzRndYLMz13xqfgBx7JWs17_kV';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function bangkokTimestamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${byType.year}-${byType.month}-${byType.day} ${byType.hour}:${byType.minute}:${byType.second} Asia/Bangkok`;
}

async function uploadReport(token, reportPath, fileName) {
  const buffer = await readFile(reportPath);
  if (!buffer.length) throw new Error('Recovery report is empty');
  const boundary = `ccpun-recovery-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const metadata = JSON.stringify({ name: fileName, parents: [RECOVERY_EVIDENCE_FOLDER_ID] });
  const payload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: application/json\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,size', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': `multipart/related; boundary=${boundary}` },
    body: payload,
  });
  if (!response.ok) throw new Error(`Recovery evidence upload failed (${response.status})`);
  const result = await response.json();
  if (!result?.id || Number(result.size) !== buffer.length) throw new Error('Recovery evidence upload verification failed');
  return result;
}

async function appendRecoveryRow(token, values) {
  const range = encodeURIComponent("'Recovery Checks'!A:G");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${REGISTRY_SHEET_ID}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ values: [values] }),
  });
  if (!response.ok) throw new Error(`Recovery Registry append failed (${response.status})`);
  const result = await response.json();
  if (!result?.updates?.updatedRows) throw new Error('Recovery Registry append did not update a row');
}

async function main() {
  const reportPath = path.resolve(required('RECOVERY_REPORT_FILE'));
  let report;
  try { report = JSON.parse(await readFile(reportPath, 'utf8')); } catch { throw new Error('Recovery report is invalid JSON'); }
  if (report?.result !== 'PASS') throw new Error('Only PASS recovery reports may be recorded as successful drills');
  if (report?.target?.projectId !== 'ccb9lnw5' || report?.target?.dataset !== 'recovery') throw new Error('Recovery report target mismatch');

  const serviceAccount = parseServiceAccount(required('GOOGLE_BACKUP_SERVICE_ACCOUNT_JSON'));
  const token = await getGoogleAccessToken(serviceAccount, [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets',
  ]);
  const evidenceName = `recovery-${report.snapshotId}-${Date.now()}.json`;
  const upload = await uploadReport(token, reportPath, evidenceName);
  const evidence = `Drive evidence ${upload.id}; GitHub run ${process.env.GITHUB_RUN_ID ?? 'unknown'}; counts/types matched snapshot manifest`;
  await appendRecoveryRow(token, [
    bangkokTimestamp(),
    'Full Sanity disaster restore drill',
    report.snapshotId,
    'ccb9lnw5/recovery',
    'PASS',
    evidence,
    'Isolated private recovery dataset; never Production/UAT',
  ]);
  console.log(JSON.stringify({ snapshotId: report.snapshotId, evidenceFileId: upload.id, result: 'PASS' }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Recovery evidence recording failed');
  process.exitCode = 1;
});
