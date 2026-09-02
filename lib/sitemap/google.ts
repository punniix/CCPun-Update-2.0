import type { SitemapUrl } from "./xml";

function timestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeSitemapLastmod(value?: string | null): string | undefined {
  if (!value) return undefined;
  const parsed = timestamp(value);
  return parsed === null ? undefined : new Date(parsed).toISOString();
}

export function resolveContentLastmod(input: {
  contentUpdatedAt?: string | null;
  sourceModifiedAt?: string | null;
  systemUpdatedAt?: string | null;
}): string | undefined {
  return (
    normalizeSitemapLastmod(input.contentUpdatedAt) ??
    normalizeSitemapLastmod(input.sourceModifiedAt) ??
    normalizeSitemapLastmod(input.systemUpdatedAt)
  );
}

export function latestSitemapLastmod(values: Array<string | null | undefined>): string | undefined {
  let latestValue: string | undefined;
  let latestTimestamp = Number.NEGATIVE_INFINITY;

  for (const value of values) {
    const normalized = normalizeSitemapLastmod(value);
    if (!normalized) continue;
    const parsed = timestamp(normalized);
    if (parsed !== null && parsed > latestTimestamp) {
      latestTimestamp = parsed;
      latestValue = normalized;
    }
  }

  return latestValue;
}

export function uniqueSortedSitemapEntries(entries: SitemapUrl[]): SitemapUrl[] {
  const byLocation = new Map<string, SitemapUrl>();

  for (const entry of entries) {
    const loc = entry.loc.trim();
    if (!loc) continue;
    const candidateLastmod = normalizeSitemapLastmod(entry.lastmod);
    const existing = byLocation.get(loc);
    const latestLastmod = latestSitemapLastmod([existing?.lastmod, candidateLastmod]);
    byLocation.set(loc, latestLastmod ? { loc, lastmod: latestLastmod } : { loc });
  }

  return [...byLocation.values()].sort((a, b) => a.loc.localeCompare(b.loc));
}
