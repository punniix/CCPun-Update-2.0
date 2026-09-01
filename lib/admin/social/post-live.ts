import { z } from "zod";
import { socialPlatformSchema, SYNTHETIC_SOCIAL_FOUNDATION } from "./foundation";
import { SYNTHETIC_PUBLISHED_SOCIAL_RECORDS, SYNTHETIC_SOCIAL_ANALYTICS } from "./operations";
import { resolveSocialRuntime, SOCIAL_UAT_RUNTIME_BRANCHES } from "./runtime";

const boundedId = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_.:-]+$/);
const metricUnitSchema = z.enum(["count", "seconds", "minutes", "percent"]);
const normalizedDimensionSchema = z.enum(["discovery", "engagement", "retention", "business-intent"]);

export const postLiveSnapshotSchema = z.object({
  snapshotId: boundedId,
  publicationId: boundedId,
  masterContentId: boundedId,
  variantId: boundedId,
  platform: socialPlatformSchema,
  providerState: z.enum(["available", "unavailable", "unsupported"]),
  collectionMode: z.literal("manual-post-live"),
  liveEndedAt: z.string().datetime(),
  fetchedAt: z.string().datetime(),
  nativeMetrics: z.array(z.object({
    key: z.string().trim().min(1).max(100),
    label: z.string().trim().min(1).max(120),
    value: z.number().nonnegative(),
    unit: metricUnitSchema,
  })).max(30),
  normalizedMetrics: z.array(z.object({
    key: z.string().trim().min(1).max(100),
    label: z.string().trim().min(1).max(120),
    value: z.number().nonnegative(),
    unit: metricUnitSchema,
    dimension: normalizedDimensionSchema,
  })).max(20),
  limitations: z.array(z.string().trim().min(1).max(240)).min(1).max(10),
  realtimePollingAllowed: z.literal(false),
  providerRequestAllowed: z.literal(false),
}).superRefine((snapshot, context) => {
  const hasNativeMetrics = snapshot.nativeMetrics.length > 0;
  const hasNormalizedMetrics = snapshot.normalizedMetrics.length > 0;
  if (
    (snapshot.providerState === "available" && (!hasNativeMetrics || !hasNormalizedMetrics))
    || (snapshot.providerState !== "available" && (hasNativeMetrics || hasNormalizedMetrics))
  ) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Available snapshots require native and normalized metrics; unavailable states require none" });
  }
  if (Date.parse(snapshot.fetchedAt) < Date.parse(snapshot.liveEndedAt)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["fetchedAt"], message: "Post-Live metrics must be fetched after the Live ends" });
  }
});

export const postLiveReportSchema = z.object({
  mode: z.literal("synthetic-uat"),
  generatedAt: z.string().datetime(),
  snapshots: z.array(postLiveSnapshotSchema).min(1).max(20),
});

export function isSyntheticPostLiveRuntimeEnabled(
  env: Record<string, string | undefined> = process.env,
) {
  if (env.CCPUN_SOCIAL_OPERATIONS_ENABLED !== "1") return false;
  const runtime = resolveSocialRuntime(env, { uatBranches: SOCIAL_UAT_RUNTIME_BRANCHES });
  return runtime?.lane === "uat";
}

export function normalizePostLiveSnapshot(
  input: Omit<z.input<typeof postLiveSnapshotSchema>, "collectionMode" | "realtimePollingAllowed" | "providerRequestAllowed">,
) {
  return postLiveSnapshotSchema.parse({
    ...input,
    collectionMode: "manual-post-live",
    realtimePollingAllowed: false,
    providerRequestAllowed: false,
  });
}

export function buildSyntheticPostLiveReport() {
  const variant = SYNTHETIC_SOCIAL_FOUNDATION.variants.find((item) => item.format === "live");
  const publication = SYNTHETIC_PUBLISHED_SOCIAL_RECORDS.find((item) => item.variantId === variant?.id);
  const nativeSnapshot = SYNTHETIC_SOCIAL_ANALYTICS.find((item) => item.publicationId === publication?.publicationId);
  if (!variant || !publication || !nativeSnapshot) throw new Error("Synthetic completed Live fixture is missing");

  return postLiveReportSchema.parse({
    mode: "synthetic-uat",
    generatedAt: "2026-08-28T10:00:00.000Z",
    snapshots: [{
      snapshotId: "post-live-snapshot-youtube-001",
      publicationId: publication.publicationId,
      masterContentId: variant.masterContentId,
      variantId: variant.id,
      platform: variant.platform,
      providerState: "available",
      collectionMode: "manual-post-live",
      liveEndedAt: "2026-08-28T08:30:00.000Z",
      fetchedAt: nativeSnapshot.fetchedAt,
      nativeMetrics: nativeSnapshot.nativeMetrics.map(({ key, label, value, unit }) => ({ key, label, value, unit })),
      normalizedMetrics: [
        { key: "retention.average_concurrent", label: "ผู้ชมพร้อมกันเฉลี่ย", value: 42, unit: "count", dimension: "retention" },
        { key: "retention.minutes_watched", label: "เวลารับชมรวม", value: 1260, unit: "minutes", dimension: "retention" },
      ],
      limitations: nativeSnapshot.limitations,
      realtimePollingAllowed: false,
      providerRequestAllowed: false,
    }],
  });
}

export const SYNTHETIC_POST_LIVE_REPORT = buildSyntheticPostLiveReport();
