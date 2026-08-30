import type { GscNormalizedRow } from "./contracts";
import type { SearchDevice, SeoObservation } from "./foundation";
import { getArticlePath } from "../../content/url";
import type { PublishedSeoObservationArticle } from "../sanity-control";

type DateRange = SeoObservation["dateRange"];

export type GscObservationContext = Pick<SeoObservation,
  | "id"
  | "queryCluster"
  | "searchIntent"
  | "intentAligned"
  | "indexable"
  | "businessValue"
  | "lastRelevantContentChangeAt"
  | "seasonality"
> & {
  page: string;
  query: string;
  device: SearchDevice;
  country: string;
};

export type AssembledGscObservation = SeoObservation & {
  country: string;
  comparisonDateRange: DateRange | null;
  comparisonFetchedAt: string | null;
};

export type GscObservationSkipReason =
  | "missing-dimensions"
  | "unsupported-device"
  | "missing-context"
  | "ambiguous-context";

export type GscObservationAssembly = {
  observations: AssembledGscObservation[];
  skipped: Array<{ row: number; reason: GscObservationSkipReason }>;
};

const devices: Record<string, SearchDevice | undefined> = {
  MOBILE: "mobile",
  DESKTOP: "desktop",
  TABLET: "tablet",
};

function validIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

function validTimestamp(value: string) {
  return Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

function validDateRange(range: DateRange) {
  return validIsoDate(range.start) &&
    validIsoDate(range.end) &&
    range.start <= range.end;
}

function rowKey(page: string, query: string, device: SearchDevice, country: string) {
  return JSON.stringify([page, query, device, country]);
}

function normalizedRowKey(row: GscNormalizedRow): { key: string; device: SearchDevice; country: string } | GscObservationSkipReason {
  const { page, query, device: providerDevice, country } = row.dimensions;
  if (!page || !query || !providerDevice || !country) return "missing-dimensions";
  const device = devices[providerDevice];
  if (!device) return "unsupported-device";
  return { key: rowKey(page, query, device, country), device, country };
}

function normalizedKeyword(value: string) {
  return value.toLocaleLowerCase("th-TH").replace(/\s+/g, " ").trim();
}

export function buildGscObservationContexts(
  rows: readonly GscNormalizedRow[],
  articles: readonly PublishedSeoObservationArticle[],
): GscObservationContext[] {
  const byPage = new Map<string, PublishedSeoObservationArticle[]>();
  for (const article of articles) {
    try {
      const page = `https://ccpun.com${getArticlePath(article)}`;
      byPage.set(page, [...(byPage.get(page) ?? []), article]);
    } catch {
      // Invalid taxonomy remains unowned instead of guessing a URL.
    }
  }

  return rows.flatMap((row, index) => {
    const normalized = normalizedRowKey(row);
    if (typeof normalized === "string") return [];
    const page = row.dimensions.page!;
    const query = row.dimensions.query!;
    const candidates = byPage.get(page) ?? [];
    const queryKey = normalizedKeyword(query);
    const matches = candidates.filter((article) => {
      const governed = [article.focusKeyword, ...(article.secondaryKeywords ?? [])]
        .filter((keyword): keyword is string => Boolean(keyword?.trim()))
        .map(normalizedKeyword);
      return Boolean(article.searchIntent?.trim()) && governed.includes(queryKey);
    });
    if (matches.length !== 1) return [];
    const article = matches[0]!;
    return [{
      id: `gsc:${article.id}:${index}`,
      page,
      query,
      device: normalized.device,
      country: normalized.country,
      queryCluster: queryKey,
      searchIntent: article.searchIntent!.trim(),
      intentAligned: true,
      indexable: article.noindex !== true,
      businessValue: 3 as const,
      lastRelevantContentChangeAt: article.updatedAt,
      seasonality: "unknown" as const,
    }];
  });
}

export function assembleGscObservations(input: {
  currentRows: readonly GscNormalizedRow[];
  previousRows: readonly GscNormalizedRow[];
  contexts: readonly GscObservationContext[];
  fetchedAt: string;
  comparisonFetchedAt: string;
  dateRange: DateRange;
  comparisonDateRange: DateRange;
  currentLimitations?: readonly string[];
  previousLimitations?: readonly string[];
}): GscObservationAssembly {
  if (!validTimestamp(input.fetchedAt) || !validTimestamp(input.comparisonFetchedAt) || !validDateRange(input.dateRange) || !validDateRange(input.comparisonDateRange)) {
    throw new Error("GSC_OBSERVATION_INVALID_PROVENANCE");
  }

  const contexts = new Map<string, GscObservationContext>();
  const ambiguousContexts = new Set<string>();
  for (const context of input.contexts) {
    const key = rowKey(context.page, context.query, context.device, context.country);
    if (contexts.has(key)) ambiguousContexts.add(key);
    else contexts.set(key, context);
  }

  const previous = new Map<string, GscNormalizedRow>();
  for (const row of input.previousRows) {
    const normalized = normalizedRowKey(row);
    if (typeof normalized === "string") continue;
    previous.set(normalized.key, row);
  }

  const observations: AssembledGscObservation[] = [];
  const skipped: GscObservationAssembly["skipped"] = [];
  input.currentRows.forEach((row, index) => {
    const normalized = normalizedRowKey(row);
    if (typeof normalized === "string") {
      skipped.push({ row: index, reason: normalized });
      return;
    }
    if (ambiguousContexts.has(normalized.key)) {
      skipped.push({ row: index, reason: "ambiguous-context" });
      return;
    }
    const context = contexts.get(normalized.key);
    if (!context) {
      skipped.push({ row: index, reason: "missing-context" });
      return;
    }

    const comparison = previous.get(normalized.key);
    const limitations = [...new Set([
      ...(input.currentLimitations ?? []),
      ...(input.previousLimitations ?? []),
      ...(!comparison ? ["No unambiguous previous GSC row matched the exact page, query, device and country dimensions."] : []),
    ].filter(Boolean))];

    observations.push({
      id: context.id,
      source: "gsc",
      fetchedAt: input.fetchedAt,
      dateRange: input.dateRange,
      comparisonDateRange: comparison ? input.comparisonDateRange : null,
      comparisonFetchedAt: comparison ? input.comparisonFetchedAt : null,
      page: context.page,
      query: context.query,
      queryCluster: context.queryCluster,
      device: normalized.device,
      country: normalized.country,
      searchAppearance: "web",
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      previous: comparison ? {
        clicks: comparison.clicks,
        impressions: comparison.impressions,
        position: comparison.position,
      } : null,
      searchIntent: context.searchIntent,
      intentAligned: context.intentAligned,
      indexable: context.indexable,
      businessValue: context.businessValue,
      lastRelevantContentChangeAt: context.lastRelevantContentChangeAt,
      seasonality: context.seasonality,
      limitations,
    });
  });

  return { observations, skipped };
}
