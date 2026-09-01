import "server-only";

import {
  ga4QueryInputSchema,
  normalizeGa4LandingPageReport,
  normalizeGa4OrganicTotalsReport,
  type Ga4LandingPageRow,
  type Ga4MetricTotals,
} from "../contracts";

const TIMEOUT_MS = 15_000;
type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

async function requestPage(url: string, token: string, body: string, fetcher: FetchLike): Promise<unknown> {
  try {
    const response = await fetcher(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.ok) {
      try {
        return await response.json() as unknown;
      } catch {
        throw new Error("GA4_INVALID_RESPONSE");
      }
    }
    if (response.status === 401 || response.status === 403) throw new Error("GA4_AUTH_REQUIRED");
    if (response.status === 429) throw new Error("GA4_RATE_LIMITED");
    if (response.status < 500) throw new Error("GA4_INVALID_RESPONSE");
    throw new Error("GA4_PROVIDER_UNAVAILABLE");
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("GA4_")) throw error;
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) throw new Error("GA4_TIMEOUT");
    throw new Error("GA4_PROVIDER_UNAVAILABLE");
  }
}

export async function fetchGa4LandingPages(rawInput: unknown, fetcher: FetchLike = fetch): Promise<{
  fetchedAt: string;
  rows: Ga4LandingPageRow[];
  truncated: boolean;
  timeZone: string | null;
  limitations: string[];
}> {
  const input = ga4QueryInputSchema.parse(rawInput);
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${input.propertyId}:runReport`;
  const raw = await requestPage(url, input.token, JSON.stringify({
    dateRanges: [{ startDate: input.startDate, endDate: input.endDate }],
    dimensions: [{ name: "landingPage" }],
    metrics: [{ name: "sessions" }, { name: "engagedSessions" }],
    dimensionFilter: { filter: { fieldName: "sessionDefaultChannelGroup", stringFilter: { matchType: "EXACT", value: "Organic Search", caseSensitive: true } } },
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: String(input.rowLimit),
    returnPropertyQuota: true,
  }), fetcher);
  let report: ReturnType<typeof normalizeGa4LandingPageReport>;
  try {
    report = normalizeGa4LandingPageReport(raw);
  } catch {
    throw new Error("GA4_INVALID_RESPONSE");
  }
  const truncated = report.rowCount > input.rowLimit;
  return {
    fetchedAt: new Date().toISOString(),
    rows: report.rows,
    truncated,
    timeZone: report.timeZone,
    limitations: [
      ...report.limitations,
      "GA4 reports may differ from the UI because of reporting identity and processing time",
      ...(truncated ? ["Reached the bounded 10,000-row manual-sync limit"] : []),
    ],
  };
}

export async function fetchGa4OrganicTotals(rawInput: unknown, fetcher: FetchLike = fetch): Promise<{
  fetchedAt: string;
  totals: Ga4MetricTotals;
  timeZone: string | null;
  limitations: string[];
}> {
  const input = ga4QueryInputSchema.parse({
    ...(typeof rawInput === "object" && rawInput !== null ? rawInput : {}),
    rowLimit: 1,
  });
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${input.propertyId}:runReport`;
  const raw = await requestPage(url, input.token, JSON.stringify({
    dateRanges: [{ startDate: input.startDate, endDate: input.endDate }],
    metrics: [{ name: "sessions" }, { name: "engagedSessions" }],
    dimensionFilter: { filter: { fieldName: "sessionDefaultChannelGroup", stringFilter: { matchType: "EXACT", value: "Organic Search", caseSensitive: true } } },
    returnPropertyQuota: true,
  }), fetcher);
  try {
    const report = normalizeGa4OrganicTotalsReport(raw);
    return { fetchedAt: new Date().toISOString(), ...report };
  } catch {
    throw new Error("GA4_INVALID_RESPONSE");
  }
}
