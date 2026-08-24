import { getGoogleAccessToken, parseServiceAccount } from '../backup/google-service-account.mjs';

const REGISTRY_SHEET_ID = process.env.GOOGLE_BACKUP_REGISTRY_SHEET_ID?.trim() || '12hwLk83xxergE9pmf_5JJICmTuti3FhWiHlPA3ebvpU';
const GSC_SITE_URL = process.env.GSC_SITE_URL?.trim() || 'sc-domain:ccpun.com';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = null; }
  if (!response.ok) {
    const message = body?.error?.message || body?.error?.error_user_msg || `${response.status} ${response.statusText}`;
    throw new Error(`${new URL(url).hostname} request failed: ${message}`);
  }
  return body;
}

async function sheetHasDate(token, sheetName, date) {
  const range = encodeURIComponent(`'${sheetName}'!A2:A`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${REGISTRY_SHEET_ID}/values/${range}?majorDimension=COLUMNS`;
  const body = await jsonFetch(url, { headers: { authorization: `Bearer ${token}` } });
  return (body?.values?.[0] ?? []).includes(date);
}

async function appendRows(token, sheetName, rows) {
  if (!rows.length) return 0;
  const range = encodeURIComponent(`'${sheetName}'!A:Z`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${REGISTRY_SHEET_ID}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const body = await jsonFetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ values: rows }),
  });
  return Number(body?.updates?.updatedRows ?? 0);
}

function value(row, index) {
  return row?.metricValues?.[index]?.value ?? '0';
}
function dimension(row, index) {
  return row?.dimensionValues?.[index]?.value ?? '';
}

async function discoverGa4Property(token) {
  const explicit = process.env.GA4_PROPERTY_ID?.trim();
  if (explicit) return explicit.replace(/^properties\//, '');
  const body = await jsonFetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200', {
    headers: { authorization: `Bearer ${token}` },
  });
  const properties = (body?.accountSummaries ?? []).flatMap((account) => account.propertySummaries ?? []);
  if (!properties.length) return null;
  const preferred = properties.filter((property) => /ccpun/i.test(property.displayName ?? ''));
  const candidate = preferred.length === 1 ? preferred[0] : properties.length === 1 ? properties[0] : null;
  return candidate?.property?.replace(/^properties\//, '') ?? null;
}

async function ga4Report(token, propertyId, body) {
  return jsonFetch(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function archiveGa4(token, date) {
  const sheet = 'GA4 Archive';
  if (await sheetHasDate(token, sheet, date)) return { source: 'GA4', date, status: 'SKIPPED_DUPLICATE', rows: 0 };
  const propertyId = await discoverGa4Property(token);
  if (!propertyId) return { source: 'GA4', date, status: 'SKIPPED_NOT_CONFIGURED', rows: 0 };

  const dimensions = [{ name: 'date' }, { name: 'landingPagePlusQueryString' }, { name: 'sessionSourceMedium' }];
  const metrics = [
    { name: 'activeUsers' },
    { name: 'sessions' },
    { name: 'screenPageViews' },
    { name: 'engagementRate' },
    { name: 'keyEvents' },
  ];
  const report = await ga4Report(token, propertyId, {
    dateRanges: [{ startDate: date, endDate: date }],
    dimensions,
    metrics,
    limit: '100000',
    keepEmptyRows: false,
  });

  let lineReport = { rows: [] };
  try {
    lineReport = await ga4Report(token, propertyId, {
      dateRanges: [{ startDate: date, endDate: date }],
      dimensions,
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'line_oa_click', caseSensitive: false } },
      },
      limit: '100000',
      keepEmptyRows: false,
    });
  } catch {
    // Main GA4 archive remains valid even if the optional LINE event breakout is incompatible or unavailable.
  }
  const lineByKey = new Map((lineReport.rows ?? []).map((row) => [
    `${dimension(row, 0)}\u0000${dimension(row, 1)}\u0000${dimension(row, 2)}`,
    Number(value(row, 0)),
  ]));

  const rows = (report.rows ?? []).map((row) => {
    const key = `${dimension(row, 0)}\u0000${dimension(row, 1)}\u0000${dimension(row, 2)}`;
    return [
      date,
      dimension(row, 1),
      dimension(row, 2),
      Number(value(row, 0)),
      Number(value(row, 1)),
      Number(value(row, 2)),
      Number(value(row, 3)),
      Number(value(row, 4)),
      lineByKey.get(key) ?? 0,
      `GA4 property ${propertyId}`,
    ];
  });
  const appended = await appendRows(token, sheet, rows);
  return { source: 'GA4', date, status: 'ARCHIVED', rows: appended, propertyId };
}

async function archiveGsc(token, date) {
  const sheet = 'GSC Archive';
  if (await sheetHasDate(token, sheet, date)) return { source: 'GSC', date, status: 'SKIPPED_DUPLICATE', rows: 0 };
  const rows = [];
  let startRow = 0;
  const rowLimit = 25000;
  do {
    const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE_URL)}/searchAnalytics/query`;
    const body = await jsonFetch(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        startDate: date,
        endDate: date,
        dimensions: ['date', 'page', 'query', 'device', 'country', 'searchAppearance'],
        rowLimit,
        startRow,
        dataState: 'final',
      }),
    });
    const batch = body?.rows ?? [];
    for (const row of batch) {
      const [rowDate = date, page = '', query = '', device = '', country = '', searchAppearance = ''] = row.keys ?? [];
      rows.push([rowDate, page, query, Number(row.clicks ?? 0), Number(row.impressions ?? 0), Number(row.ctr ?? 0), Number(row.position ?? 0), device, country, searchAppearance]);
    }
    if (batch.length < rowLimit) break;
    startRow += batch.length;
  } while (startRow < 250000);
  const appended = await appendRows(token, sheet, rows);
  return { source: 'GSC', date, status: 'ARCHIVED', rows: appended, site: GSC_SITE_URL };
}

async function discoverMetaAdAccount(version, accessToken) {
  const explicit = process.env.META_AD_ACCOUNT_ID?.trim();
  if (explicit) return explicit.replace(/^act_/, '');
  const url = new URL(`https://graph.facebook.com/${version}/me/adaccounts`);
  url.searchParams.set('fields', 'id,name');
  url.searchParams.set('limit', '100');
  url.searchParams.set('access_token', accessToken);
  const body = await jsonFetch(url);
  const accounts = body?.data ?? [];
  const preferred = accounts.filter((account) => /ccpun/i.test(account.name ?? ''));
  const candidate = preferred.length === 1 ? preferred[0] : accounts.length === 1 ? accounts[0] : null;
  return candidate?.id?.replace(/^act_/, '') ?? null;
}

function compactActions(actions) {
  if (!Array.isArray(actions) || !actions.length) return '';
  return actions.map(({ action_type, value }) => `${action_type}=${value}`).join('; ').slice(0, 1000);
}

async function archiveMeta(token, date) {
  const sheet = 'Meta Archive';
  if (await sheetHasDate(token, sheet, date)) return { source: 'Meta', date, status: 'SKIPPED_DUPLICATE', rows: 0 };
  const accessToken = process.env.META_MARKETING_API_TOKEN?.trim();
  if (!accessToken) return { source: 'Meta', date, status: 'SKIPPED_NOT_CONFIGURED', rows: 0 };
  const version = process.env.META_GRAPH_API_VERSION?.trim() || 'v24.0';
  const adAccountId = await discoverMetaAdAccount(version, accessToken);
  if (!adAccountId) return { source: 'Meta', date, status: 'SKIPPED_AMBIGUOUS_ACCOUNT', rows: 0 };

  const first = new URL(`https://graph.facebook.com/${version}/act_${adAccountId}/insights`);
  first.searchParams.set('fields', 'date_start,campaign_name,adset_name,ad_name,spend,impressions,reach,clicks,ctr,actions');
  first.searchParams.set('level', 'ad');
  first.searchParams.set('time_increment', '1');
  first.searchParams.set('limit', '500');
  first.searchParams.set('time_range', JSON.stringify({ since: date, until: date }));
  first.searchParams.set('access_token', accessToken);

  const rows = [];
  let next = first.toString();
  let pages = 0;
  while (next && pages < 100) {
    const body = await jsonFetch(next);
    for (const row of body?.data ?? []) {
      rows.push([
        row.date_start ?? date,
        row.campaign_name ?? '',
        row.adset_name ?? '',
        row.ad_name ?? '',
        Number(row.spend ?? 0),
        Number(row.impressions ?? 0),
        Number(row.reach ?? 0),
        Number(row.clicks ?? 0),
        Number(row.ctr ?? 0),
        compactActions(row.actions),
      ]);
    }
    next = body?.paging?.next ?? '';
    pages += 1;
  }
  const appended = await appendRows(token, sheet, rows);
  return { source: 'Meta', date, status: 'ARCHIVED', rows: appended, adAccountId };
}

async function main() {
  const googleServiceAccount = parseServiceAccount(required('GOOGLE_BACKUP_SERVICE_ACCOUNT_JSON'));
  const googleToken = await getGoogleAccessToken(googleServiceAccount, [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly',
  ]);
  const stableDate = required('REPORT_DATE');
  const metaDate = process.env.META_REPORT_DATE?.trim() || stableDate;

  const results = [];
  for (const run of [
    () => archiveGa4(googleToken, stableDate),
    () => archiveGsc(googleToken, stableDate),
    () => archiveMeta(googleToken, metaDate),
  ]) {
    try {
      results.push(await run());
    } catch (error) {
      results.push({ status: 'ERROR', message: error instanceof Error ? error.message : 'unknown archive error' });
    }
  }

  console.log(JSON.stringify(results, null, 2));
  if (results.some((result) => result.status === 'ERROR')) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Analytics archive failed');
  process.exitCode = 1;
});
