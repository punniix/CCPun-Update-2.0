import { z } from "zod";
import { researchInputSchema, type ResearchInput } from "./research-input";

export const UBERSUGGEST_AUTH_MAX_AGE_MS = 10 * 60 * 1000;

const overviewSchema = z.object({
  search_volume: z.number().min(0).nullish(),
  seo_difficulty: z.number().min(0).max(100).nullish(),
  search_intent: z.string().trim().max(80).nullish(),
  language: z.string().trim().max(80).nullish(),
  location: z.string().trim().max(120).nullish(),
}).passthrough();

const serpSchema = z.object({
  updated_at: z.string().max(40).optional(),
  serpEntries: z.array(z.object({
    position: z.number().int().positive().nullish(),
    title: z.string().trim().max(500).nullish(),
    url: z.string().url().nullish(),
    domain: z.string().trim().max(255).nullish(),
    type: z.string().trim().max(80).nullish(),
  }).passthrough()).max(100).default([]),
}).passthrough();

function normalizedIntent(value: string | null | undefined): ResearchInput["intent"] {
  const normalized = value?.toLowerCase();
  if (normalized?.includes("inform")) return "informational";
  if (normalized?.includes("transact")) return "transactional";
  if (normalized?.includes("navig")) return "navigational";
  if (normalized?.includes("commercial")) return "commercial";
  return normalized ? "mixed" : undefined;
}

export function isUbersuggestAuthorizationStateValid(
  pending: { state: string; createdAt: string } | undefined,
  receivedState: string | null,
  now = Date.now(),
) {
  if (!pending || receivedState !== pending.state) return false;
  const createdAt = Date.parse(pending.createdAt);
  const age = now - createdAt;
  return Number.isFinite(createdAt) && age >= 0 && age <= UBERSUGGEST_AUTH_MAX_AGE_MS;
}

export function hasUbersuggestCredentials(tokens: { access_token?: unknown; refresh_token?: unknown } | undefined) {
  return Boolean(tokens && (
    (typeof tokens.access_token === "string" && tokens.access_token.length > 0)
    || (typeof tokens.refresh_token === "string" && tokens.refresh_token.length > 0)
  ));
}

export function isUbersuggestSnapshotFresh(value: string | null | undefined, maxAgeHours: number, now = Date.now()) {
  if (!value) return false;
  const checkedAt = Date.parse(value);
  return Number.isFinite(checkedAt) && checkedAt <= now && now - checkedAt <= maxAgeHours * 60 * 60 * 1000;
}

export function normalizeUbersuggestResearch(input: {
  keyword: string;
  overview: unknown;
  serp: unknown;
  checkedAt?: string;
}) {
  const overview = overviewSchema.parse(input.overview);
  const serp = serpSchema.parse(input.serp);
  const entries = serp.serpEntries.filter((entry) => entry.url).slice(0, 10);
  return researchInputSchema.parse({
    keyword: input.keyword,
    provider: "ubersuggest",
    scope: overview.location ?? "Global",
    volume: overview.search_volume ?? undefined,
    difficulty: overview.seo_difficulty ?? undefined,
    intent: normalizedIntent(overview.search_intent),
    serp: entries.map((entry) => ({
      position: entry.position ?? undefined,
      title: entry.title ?? undefined,
      url: entry.url ?? undefined,
      domain: entry.domain ?? undefined,
    })),
    competitors: [...new Set(entries.map((entry) => entry.domain).filter((value): value is string => Boolean(value)))],
    checkedAt: input.checkedAt ?? new Date().toISOString(),
  });
}
