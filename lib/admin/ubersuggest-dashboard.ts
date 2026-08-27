import "server-only";

import { randomUUID } from "node:crypto";
import { createClient, groq } from "next-sanity";
import { z } from "zod";
import { isAdminDataPlaneAllowed, isAdminReadDataPlaneAllowed } from "./environment";
import { getAdminSanityReadToken, getAdminSanityResearchWriteToken } from "./sanity-credentials";
import { buildAuditLogDocument } from "./sanity-control";
import { privateAdminDocumentId } from "./suggestion-lifecycle";
import type { UbersuggestDashboardSync } from "./ubersuggest-dashboard-provider";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();
const readToken = getAdminSanityReadToken();
const writeToken = getAdminSanityResearchWriteToken();

const quotaSchema = z.object({
  key: z.string(),
  label: z.string(),
  limit: z.number().min(0),
  used: z.number().min(0),
  remaining: z.number().min(0),
  status: z.enum(["available", "near-limit", "full"]),
});

const accountSnapshotSchema = z.object({
  id: z.string(),
  tier: z.string().nullish(),
  domain: z.string(),
  projectId: z.string(),
  updateFrequency: z.string().nullish(),
  quotas: z.array(quotaSchema).default([]),
  checkedAt: z.string(),
});

const geoProviderSchema = z.object({
  provider: z.string(),
  averageRank: z.number().nullish(),
  totalMentions: z.number().min(0).default(0),
  visibilityPercentage: z.number().min(0).max(100).default(0),
});

const geoCompetitorSchema = z.object({
  brandName: z.string(),
  brandDomain: z.string().nullish(),
  averageRank: z.number().nullish(),
  totalMentions: z.number().min(0).default(0),
  visibilityPercentage: z.number().min(0).max(100).default(0),
  sentimentLabel: z.string().nullish(),
});

const geoPromptSchema = z.object({
  promptText: z.string(),
  topic: z.string().nullish(),
  language: z.string().nullish(),
  locId: z.number().int().nullish(),
  intents: z.array(z.string()).default([]),
  totalAnswers: z.number().min(0).default(0),
  userAverageRank: z.number().nullish(),
  userTotalMentions: z.number().min(0).default(0),
  userVisibilityPercentage: z.number().min(0).max(100).default(0),
  topBrands: z.array(z.string()).default([]),
});

const geoSnapshotSchema = z.object({
  id: z.string(),
  domain: z.string(),
  projectId: z.string(),
  windowStart: z.string(),
  windowEnd: z.string(),
  visibilityPercentage: z.number().min(0).max(100).default(0),
  totalMentions: z.number().min(0).default(0),
  shareOfVoice: z.number().min(0).default(0),
  averageRank: z.number().nullish(),
  totalAnswers: z.number().min(0).default(0),
  totalPrompts: z.number().min(0).default(0),
  totalCompetitors: z.number().min(0).default(0),
  providers: z.array(geoProviderSchema).default([]),
  competitors: z.array(geoCompetitorSchema).default([]),
  intents: z.array(z.object({ intent: z.string(), value: z.number().min(0) })).default([]),
  prompts: z.array(geoPromptSchema).default([]),
  checkedAt: z.string(),
});

const researchHistorySchema = z.object({
  id: z.string(),
  keyword: z.string(),
  scope: z.string().nullish(),
  volume: z.number().nullish(),
  difficulty: z.number().nullish(),
  intent: z.string().nullish(),
  serpCount: z.number().min(0).default(0),
  checkedAt: z.string(),
});

const dashboardSchema = z.object({
  account: accountSnapshotSchema.nullable(),
  geo: geoSnapshotSchema.nullable(),
  history: z.array(researchHistorySchema).default([]),
});

function readClient() {
  if (!projectId || !dataset || !readToken || !isAdminReadDataPlaneAllowed(dataset)) return null;
  return createClient({ projectId, dataset, token: readToken, apiVersion: "2026-08-20", useCdn: false, perspective: "raw" });
}

function writeClient() {
  if (!projectId || !dataset || !writeToken || !isAdminDataPlaneAllowed(dataset)) return null;
  return createClient({ projectId, dataset, token: writeToken, apiVersion: "2026-08-20", useCdn: false, perspective: "raw" });
}

function arrayKey(prefix: string, index: number) {
  return `${prefix}${index.toString(36)}`;
}

export function isUbersuggestSyncWriteReady() {
  return Boolean(writeClient());
}

export function isSnapshotFresh(value: string | null | undefined, maxAgeHours: number, now = Date.now()) {
  if (!value) return false;
  const checkedAt = Date.parse(value);
  return Number.isFinite(checkedAt) && checkedAt <= now && now - checkedAt <= maxAgeHours * 60 * 60 * 1000;
}

export async function persistUbersuggestDashboardSync(
  input: UbersuggestDashboardSync,
  context: { actor: string; actorType: "human"; requestId: string },
) {
  const client = writeClient();
  if (!client) throw new Error("SANITY_WRITE_NOT_CONFIGURED");
  const accountId = privateAdminDocumentId(`ubersuggestAccountSnapshot.${randomUUID()}`);
  const geoId = privateAdminDocumentId(`ubersuggestGeoSnapshot.${randomUUID()}`);
  const auditId = `auditLog.${randomUUID()}`;

  const accountDocument = {
    _id: accountId,
    _type: "ubersuggestAccountSnapshot",
    provider: "ubersuggest",
    tier: input.account.tier,
    domain: input.account.domain,
    projectId: input.account.projectId,
    updateFrequency: input.account.updateFrequency,
    quotas: input.account.quotas.map((item, index) => ({ _key: arrayKey("q", index), _type: "providerQuota", ...item })),
    checkedAt: input.checkedAt,
  };

  const geoDocument = {
    _id: geoId,
    _type: "ubersuggestGeoSnapshot",
    provider: "ubersuggest",
    domain: input.geo.domain,
    projectId: input.geo.projectId,
    windowStart: input.geo.windowStart,
    windowEnd: input.geo.windowEnd,
    visibilityPercentage: input.geo.visibilityPercentage,
    totalMentions: input.geo.totalMentions,
    shareOfVoice: input.geo.shareOfVoice,
    averageRank: input.geo.averageRank,
    totalAnswers: input.geo.totalAnswers,
    totalPrompts: input.geo.totalPrompts,
    totalCompetitors: input.geo.totalCompetitors,
    providers: input.geo.providers.map((item, index) => ({ _key: arrayKey("p", index), _type: "ubersuggestGeoProvider", ...item })),
    competitors: input.geo.competitors.map((item, index) => ({ _key: arrayKey("c", index), _type: "ubersuggestGeoCompetitor", ...item })),
    intents: input.geo.intents.map((item, index) => ({ _key: arrayKey("i", index), _type: "ubersuggestGeoIntent", ...item })),
    prompts: input.geo.prompts.map((item, index) => ({ _key: arrayKey("g", index), _type: "ubersuggestGeoPrompt", ...item })),
    checkedAt: input.checkedAt,
  };

  const auditDocument = buildAuditLogDocument({
    id: auditId,
    actor: context.actor,
    actorType: context.actorType,
    action: "ubersuggest:sync-account-geo",
    objectType: "providerSnapshot",
    objectId: accountId,
    after: {
      domain: input.account.domain,
      quotaCount: input.account.quotas.length,
      geoPrompts: input.geo.totalPrompts,
      geoMentions: input.geo.totalMentions,
    },
    requestId: context.requestId,
    timestamp: input.checkedAt,
  });

  await client.transaction().create(accountDocument).create(geoDocument).create(auditDocument).commit();
  return { accountId, geoId, checkedAt: input.checkedAt };
}

export async function getUbersuggestDashboardData(historyLimit = 20) {
  const client = readClient();
  if (!client) return { account: null, geo: null, history: [], error: "not-configured" as const };
  const limit = Math.max(1, Math.min(historyLimit, 100));
  try {
    const raw = await client.fetch(groq`{
      "account": *[_type == "ubersuggestAccountSnapshot"] | order(checkedAt desc)[0]{
        "id": _id,
        tier,
        domain,
        projectId,
        updateFrequency,
        quotas[]{key, label, limit, used, remaining, status},
        checkedAt
      },
      "geo": *[_type == "ubersuggestGeoSnapshot"] | order(checkedAt desc)[0]{
        "id": _id,
        domain,
        projectId,
        windowStart,
        windowEnd,
        visibilityPercentage,
        totalMentions,
        shareOfVoice,
        averageRank,
        totalAnswers,
        totalPrompts,
        totalCompetitors,
        providers[]{provider, averageRank, totalMentions, visibilityPercentage},
        competitors[]{brandName, brandDomain, averageRank, totalMentions, visibilityPercentage, sentimentLabel},
        intents[]{intent, value},
        prompts[]{promptText, topic, language, locId, intents, totalAnswers, userAverageRank, userTotalMentions, userVisibilityPercentage, topBrands},
        checkedAt
      },
      "history": *[_type == "researchSnapshot" && provider == "ubersuggest"] | order(checkedAt desc)[0...$limit]{
        "id": _id,
        keyword,
        scope,
        volume,
        difficulty,
        intent,
        "serpCount": count(serp),
        checkedAt
      }
    }`, { limit });
    return { ...dashboardSchema.parse(raw), error: null };
  } catch {
    return { account: null, geo: null, history: [], error: "request-failed" as const };
  }
}
