import "server-only";

import { z } from "zod";
import { callUbersuggestTools } from "./ubersuggest";

const quotaUsageSchema = z.object({
  limit: z.number().int().min(0),
  used: z.number().int().min(0),
}).passthrough();

const authStatusSchema = z.object({
  authenticated: z.boolean(),
  tier: z.string().trim().min(1).max(80),
}).passthrough();

const projectSchema = z.object({
  id: z.string().min(1),
  domain: z.string().min(1),
  title: z.string().nullish(),
  update_freq: z.string().nullish(),
  has_brand: z.boolean().optional(),
  limits: z.object({
    keywords: quotaUsageSchema.optional(),
    locations: quotaUsageSchema.optional(),
    competitors: quotaUsageSchema.optional(),
    add_ons: z.record(z.string(), quotaUsageSchema).optional(),
  }).passthrough().optional(),
}).passthrough();

const projectListSchema = z.object({ projects: z.array(projectSchema) }).passthrough();

const brandConfigSchema = z.object({
  domain: z.string().nullish(),
  name: z.string().nullish(),
  update_frequency: z.string().nullish(),
  prompts: z.array(z.string()).default([]),
  limits: z.object({
    prompts: z.number().int().min(0).optional(),
    prompts_to_update: z.number().int().min(0).optional(),
    update_frequency: z.string().optional(),
    brand_operations_limits: z.number().int().min(0).optional(),
    brand_operations_used: z.number().int().min(0).optional(),
  }).passthrough().optional(),
}).passthrough();

const currentNumberSchema = z.object({ current: z.number().nullish() }).passthrough();
const providerVisibilitySchema = z.object({
  provider: z.string(),
  average_rank: currentNumberSchema.optional(),
  total_mentions: z.number().min(0).default(0),
  visibility_percentage: currentNumberSchema.optional(),
}).passthrough();

const competitorSchema = z.object({
  brand_name: z.string(),
  brand_domain: z.string().nullish(),
  is_user_brand: z.boolean().optional(),
  average_rank: z.number().nullish(),
  total_mentions: z.number().min(0).default(0),
  visibility_percentage: z.number().min(0).max(100).default(0),
  sentiment: z.object({ label: z.string().nullish() }).passthrough().nullish(),
}).passthrough();

const visibilityOverviewSchema = z.object({
  overview: z.object({
    user_brand_average_rank: currentNumberSchema.optional(),
    user_brand_total_mentions: z.number().min(0).default(0),
    user_brand_visibility_percentage: currentNumberSchema.optional(),
    user_brand_by_provider: z.array(providerVisibilitySchema).default([]),
    total_answers: z.number().min(0).default(0),
    total_prompts: z.number().min(0).default(0),
    total_competitors: z.number().min(0).default(0),
    user_brand_share_of_voice: currentNumberSchema.optional(),
  }).passthrough(),
  brand_aggregations: z.array(competitorSchema).default([]),
  aggregated_intents: z.record(z.string(), z.number().min(0)).default({}),
}).passthrough();

const promptAggregationSchema = z.object({
  prompt_text: z.string(),
  topic: z.string().nullish(),
  language: z.string().nullish(),
  loc_id: z.number().int().nullish(),
  intents: z.array(z.string()).default([]),
  total_answers: z.number().min(0).default(0),
  user_brand_data: z.object({
    average_rank: z.number().nullish(),
    total_mentions: z.number().min(0).default(0),
    visibility_percentage: z.number().min(0).max(100).default(0),
  }).passthrough(),
  brands_found: z.array(z.object({
    brand_name: z.string(),
    visibility_percentage: z.number().min(0).max(100).default(0),
    average_rank: z.number().nullish(),
    total_mentions: z.number().min(0).default(0),
  }).passthrough()).default([]),
}).passthrough();

const brandPromptsSchema = z.object({
  prompt_aggregations: z.array(promptAggregationSchema).default([]),
}).passthrough();

export type UbersuggestQuota = {
  key: string;
  label: string;
  limit: number;
  used: number;
  remaining: number;
  status: "available" | "near-limit" | "full";
};

export type UbersuggestDashboardSync = {
  checkedAt: string;
  account: {
    tier: string;
    domain: string;
    projectId: string;
    updateFrequency: string | null;
    quotas: UbersuggestQuota[];
  };
  geo: {
    domain: string;
    projectId: string;
    windowStart: string;
    windowEnd: string;
    visibilityPercentage: number;
    totalMentions: number;
    shareOfVoice: number;
    averageRank: number | null;
    totalAnswers: number;
    totalPrompts: number;
    totalCompetitors: number;
    providers: Array<{ provider: string; averageRank: number | null; totalMentions: number; visibilityPercentage: number }>;
    competitors: Array<{ brandName: string; brandDomain: string | null; averageRank: number | null; totalMentions: number; visibilityPercentage: number; sentimentLabel: string | null }>;
    intents: Array<{ intent: string; value: number }>;
    prompts: Array<{
      promptText: string;
      topic: string | null;
      language: string | null;
      locId: number | null;
      intents: string[];
      totalAnswers: number;
      userAverageRank: number | null;
      userTotalMentions: number;
      userVisibilityPercentage: number;
      topBrands: string[];
    }>;
  };
};

function unwrapMessagePayload(value: unknown) {
  if (!value || typeof value !== "object" || !("message" in value)) return value;
  const message = (value as { message?: unknown }).message;
  if (typeof message !== "string") return value;
  try {
    return JSON.parse(message) as unknown;
  } catch {
    throw new Error("UBERSUGGEST_INVALID_RESPONSE");
  }
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function quota(key: string, label: string, limit: number | undefined, used: number | undefined): UbersuggestQuota | null {
  if (limit == null || used == null) return null;
  const remaining = Math.max(0, limit - used);
  const ratio = limit > 0 ? used / limit : 1;
  return {
    key,
    label,
    limit,
    used,
    remaining,
    status: remaining === 0 ? "full" : ratio >= 0.8 ? "near-limit" : "available",
  };
}

export async function fetchUbersuggestDashboardSync(domain = "ccpun.com"): Promise<UbersuggestDashboardSync> {
  const base = await callUbersuggestTools([
    { key: "auth", name: "auth_status" },
    { key: "projects", name: "list_projects" },
  ]);
  const auth = authStatusSchema.parse(unwrapMessagePayload(base.auth));
  if (!auth.authenticated) throw new Error("UBERSUGGEST_AUTH_REQUIRED");
  const projects = projectListSchema.parse(unwrapMessagePayload(base.projects));
  const project = projects.projects.find((item) => item.domain.toLowerCase() === domain.toLowerCase());
  if (!project) throw new Error("UBERSUGGEST_PROJECT_NOT_FOUND");

  const now = new Date();
  const windowEnd = isoDate(now);
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 29);
  const windowStart = isoDate(start);

  const detail = await callUbersuggestTools([
    { key: "brandConfig", name: "brand_config", arguments: { project_id: project.id } },
    { key: "visibility", name: "brand_visibility_overview", arguments: { project_id: project.id, start_date: windowStart, end_date: windowEnd } },
    { key: "prompts", name: "brand_prompts", arguments: { project_id: project.id, start_date: windowStart, end_date: windowEnd } },
  ]);

  const brandConfig = brandConfigSchema.parse(unwrapMessagePayload(detail.brandConfig));
  const visibility = visibilityOverviewSchema.parse(unwrapMessagePayload(detail.visibility));
  const prompts = brandPromptsSchema.parse(unwrapMessagePayload(detail.prompts));

  const quotaRows: UbersuggestQuota[] = [];
  const addQuota = (row: UbersuggestQuota | null) => { if (row) quotaRows.push(row); };
  addQuota(quota("tracked-keywords", "Rank Tracking Keywords", project.limits?.keywords?.limit, project.limits?.keywords?.used));
  addQuota(quota("locations", "Locations", project.limits?.locations?.limit, project.limits?.locations?.used));
  addQuota(quota("competitors", "Competitors", project.limits?.competitors?.limit, project.limits?.competitors?.used));
  addQuota(quota("ai-prompts", "AI Search Visibility Prompts", brandConfig.limits?.prompts, brandConfig.prompts.length));
  addQuota(quota("brand-operations", "AI Brand Operations", brandConfig.limits?.brand_operations_limits, brandConfig.limits?.brand_operations_used));
  for (const [key, value] of Object.entries(project.limits?.add_ons ?? {})) {
    addQuota(quota(`addon:${key}`, `Add-on: ${key}`, value.limit, value.used));
  }

  const overview = visibility.overview;
  const competitors = visibility.brand_aggregations
    .filter((item) => !item.is_user_brand)
    .slice(0, 25)
    .map((item) => ({
      brandName: item.brand_name,
      brandDomain: item.brand_domain ?? null,
      averageRank: item.average_rank ?? null,
      totalMentions: item.total_mentions,
      visibilityPercentage: item.visibility_percentage,
      sentimentLabel: item.sentiment?.label ?? null,
    }));

  return {
    checkedAt: now.toISOString(),
    account: {
      tier: auth.tier,
      domain: project.domain,
      projectId: project.id,
      updateFrequency: brandConfig.update_frequency ?? project.update_freq ?? null,
      quotas: quotaRows,
    },
    geo: {
      domain: project.domain,
      projectId: project.id,
      windowStart,
      windowEnd,
      visibilityPercentage: overview.user_brand_visibility_percentage?.current ?? 0,
      totalMentions: overview.user_brand_total_mentions,
      shareOfVoice: overview.user_brand_share_of_voice?.current ?? 0,
      averageRank: overview.user_brand_average_rank?.current ?? null,
      totalAnswers: overview.total_answers,
      totalPrompts: overview.total_prompts,
      totalCompetitors: overview.total_competitors,
      providers: overview.user_brand_by_provider.map((item) => ({
        provider: item.provider,
        averageRank: item.average_rank?.current ?? null,
        totalMentions: item.total_mentions,
        visibilityPercentage: item.visibility_percentage?.current ?? 0,
      })),
      competitors,
      intents: Object.entries(visibility.aggregated_intents).map(([intent, value]) => ({ intent, value })),
      prompts: prompts.prompt_aggregations.map((item) => ({
        promptText: item.prompt_text,
        topic: item.topic ?? null,
        language: item.language ?? null,
        locId: item.loc_id ?? null,
        intents: item.intents,
        totalAnswers: item.total_answers,
        userAverageRank: item.user_brand_data.average_rank ?? null,
        userTotalMentions: item.user_brand_data.total_mentions,
        userVisibilityPercentage: item.user_brand_data.visibility_percentage,
        topBrands: item.brands_found.slice(0, 5).map((brand) => brand.brand_name),
      })),
    },
  };
}
