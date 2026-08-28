import { z } from "zod";
import { CCPUN_VERCEL_PROJECT_IDS, parseAdminEnvironment, type AdminEnvironment } from "../environment";
import {
  socialFoundationSnapshotSchema,
  socialPlatformSchema,
  SYNTHETIC_SOCIAL_FOUNDATION,
} from "./foundation";

export const WEBSITE_42_SOCIAL_OPERATIONS_BRANCH = "codex/website-42-social-operations-core-20260828";

const boundedId = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_.:-]+$/);
const metricDimensionSchema = z.enum(["discovery", "engagement", "deep-engagement", "retention", "business-intent"]);

export const socialPublicationPlanSchema = z.object({
  publicationId: boundedId,
  variantId: boundedId,
  platform: socialPlatformSchema,
  nextAction: z.enum(["wait-human-review", "prepare-native-handoff", "wait-human-finish", "hold"]),
  providerWriteAllowed: z.literal(false),
  reason: z.string().trim().min(1).max(240),
});

export const socialMetricSnapshotSchema = z.object({
  publicationId: boundedId,
  platform: socialPlatformSchema,
  source: z.literal("synthetic-uat"),
  fetchedAt: z.string().datetime(),
  nativeMetrics: z.array(z.object({
    key: z.string().trim().min(1).max(80),
    label: z.string().trim().min(1).max(120),
    value: z.number().nonnegative(),
    unit: z.enum(["count", "seconds", "minutes"]),
    dimension: metricDimensionSchema,
  })).min(1).max(20),
  limitations: z.array(z.string().trim().min(1).max(240)).min(1).max(10),
});

export const socialOperationsSnapshotSchema = z.object({
  mode: z.literal("synthetic-uat"),
  publicationPlans: z.array(socialPublicationPlanSchema).min(1).max(20),
  analytics: z.array(socialMetricSnapshotSchema).min(1).max(20),
});

export function buildSyntheticPublicationPlans(
  foundation = socialFoundationSnapshotSchema.parse(SYNTHETIC_SOCIAL_FOUNDATION),
) {
  return foundation.variants.map((variant) => {
    if (variant.status === "draft") {
      return {
        publicationId: `uat-publication:${variant.id}`,
        variantId: variant.id,
        platform: variant.platform,
        nextAction: "wait-human-review" as const,
        providerWriteAllowed: false as const,
        reason: "ชิ้นงานยังเป็น Draft จึงยังสร้างงานส่งออกไม่ได้",
      };
    }
    if (variant.status === "awaiting-native-finish") {
      return {
        publicationId: `uat-publication:${variant.id}`,
        variantId: variant.id,
        platform: variant.platform,
        nextAction: "wait-human-finish" as const,
        providerWriteAllowed: false as const,
        reason: "ชิ้นงานต้องจบงานและยืนยันในแอปของแพลตฟอร์ม",
      };
    }
    if (variant.status === "approved" && variant.publishingMode === "native-scheduled") {
      return {
        publicationId: `uat-publication:${variant.id}`,
        variantId: variant.id,
        platform: variant.platform,
        nextAction: "prepare-native-handoff" as const,
        providerWriteAllowed: false as const,
        reason: "ผ่านการอนุมัติแล้ว แต่รอบนี้สร้างได้เฉพาะแผนส่งต่อจำลอง",
      };
    }
    return {
      publicationId: `uat-publication:${variant.id}`,
      variantId: variant.id,
      platform: variant.platform,
      nextAction: "hold" as const,
      providerWriteAllowed: false as const,
      reason: "สถานะปัจจุบันยังไม่มีการดำเนินการที่ปลอดภัย",
    };
  });
}

export const SYNTHETIC_SOCIAL_ANALYTICS = [
  {
    publicationId: "uat-publication:synthetic-facebook-001",
    platform: "facebook",
    source: "synthetic-uat",
    fetchedAt: "2026-08-28T08:00:00.000Z",
    nativeMetrics: [
      { key: "facebook.reach", label: "Reach", value: 2400, unit: "count", dimension: "discovery" },
      { key: "facebook.comments", label: "Comments", value: 18, unit: "count", dimension: "deep-engagement" },
      { key: "facebook.shares", label: "Shares", value: 32, unit: "count", dimension: "deep-engagement" },
    ],
    limitations: ["Fixture สำหรับทดสอบ UAT ไม่ใช่ข้อมูลจาก Facebook"],
  },
  {
    publicationId: "uat-publication:synthetic-instagram-001",
    platform: "instagram",
    source: "synthetic-uat",
    fetchedAt: "2026-08-28T08:00:00.000Z",
    nativeMetrics: [
      { key: "instagram.views", label: "Views", value: 1800, unit: "count", dimension: "discovery" },
      { key: "instagram.saves", label: "Saves", value: 74, unit: "count", dimension: "deep-engagement" },
      { key: "instagram.shares", label: "Shares", value: 21, unit: "count", dimension: "deep-engagement" },
    ],
    limitations: ["Fixture สำหรับทดสอบ UAT ไม่ใช่ข้อมูลจาก Instagram"],
  },
  {
    publicationId: "uat-publication:synthetic-tiktok-001",
    platform: "tiktok",
    source: "synthetic-uat",
    fetchedAt: "2026-08-28T08:00:00.000Z",
    nativeMetrics: [
      { key: "tiktok.view_count", label: "View count", value: 950, unit: "count", dimension: "discovery" },
      { key: "tiktok.comment_count", label: "Comment count", value: 11, unit: "count", dimension: "engagement" },
      { key: "tiktok.share_count", label: "Share count", value: 9, unit: "count", dimension: "deep-engagement" },
    ],
    limitations: ["Fixture สำหรับทดสอบ UAT ไม่ใช่ข้อมูลจาก TikTok"],
  },
  {
    publicationId: "uat-publication:synthetic-youtube-001",
    platform: "youtube",
    source: "synthetic-uat",
    fetchedAt: "2026-08-28T08:00:00.000Z",
    nativeMetrics: [
      { key: "youtube.views", label: "Views", value: 1200, unit: "count", dimension: "discovery" },
      { key: "youtube.estimatedMinutesWatched", label: "Estimated minutes watched", value: 840, unit: "minutes", dimension: "retention" },
      { key: "youtube.averageViewDuration", label: "Average view duration", value: 42, unit: "seconds", dimension: "retention" },
    ],
    limitations: ["Fixture สำหรับทดสอบ UAT ไม่ใช่ข้อมูลจาก YouTube"],
  },
] as const;

export const SYNTHETIC_SOCIAL_OPERATIONS = socialOperationsSnapshotSchema.parse({
  mode: "synthetic-uat",
  publicationPlans: buildSyntheticPublicationPlans(),
  analytics: SYNTHETIC_SOCIAL_ANALYTICS,
});

export function isSocialOperationsEnabled(input: {
  flag: string | undefined;
  dataMode: string | undefined;
  environment: AdminEnvironment;
  projectId: string | undefined;
  gitBranch: string | undefined;
  sanityProjectId: string | undefined;
  sanityDataset: string | undefined;
}) {
  return input.flag === "1"
    && input.dataMode === "synthetic"
    && input.environment === "admin-uat"
    && input.projectId === CCPUN_VERCEL_PROJECT_IDS.adminProduction
    && input.gitBranch === WEBSITE_42_SOCIAL_OPERATIONS_BRANCH
    && input.sanityProjectId === "ccb9lnw5"
    && input.sanityDataset === "uat";
}

export function getSocialOperationsRuntimeStatus() {
  const environment = parseAdminEnvironment(process.env.CCPUN_APP_ENV);
  return {
    environment,
    enabled: isSocialOperationsEnabled({
      flag: process.env.CCPUN_SOCIAL_OPERATIONS_ENABLED,
      dataMode: process.env.CCPUN_SOCIAL_DATA_MODE,
      environment,
      projectId: process.env.VERCEL_PROJECT_ID?.trim() || process.env.NEXT_PUBLIC_CCPUN_VERCEL_PROJECT_ID?.trim(),
      gitBranch: process.env.VERCEL_GIT_COMMIT_REF?.trim(),
      sanityProjectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim(),
      sanityDataset: process.env.NEXT_PUBLIC_SANITY_DATASET?.trim(),
    }),
  };
}
