import { z } from "zod";
import { type AdminEnvironment } from "../environment";
import {
  publicationStatusSchema,
  publishingModeSchema,
  type PublicationStatus,
  socialMainPostFormatSchema,
  socialFoundationSnapshotSchema,
  socialPlatformSchema,
  SYNTHETIC_SOCIAL_FOUNDATION,
} from "./foundation";
import { WEBSITE_42_SOCIAL_ANALYTICS_BRANCH, WEBSITE_42_SOCIAL_PROVIDER_BRANCH } from "./provider-readonly";
import {
  resolveSocialRuntimeDescriptor,
  socialRuntimeInputFromEnvironment,
  SOCIAL_UAT_OPERATIONS_BRANCH,
} from "./runtime";

export const WEBSITE_42_SOCIAL_OPERATIONS_BRANCH = SOCIAL_UAT_OPERATIONS_BRANCH;

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
  source: z.enum(["synthetic-uat", "meta", "youtube", "tiktok"]),
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

export const socialPublicationRecordSchema = z.object({
  publicationId: boundedId,
  variantId: boundedId,
  platform: socialPlatformSchema,
  format: socialMainPostFormatSchema,
  publishingMode: publishingModeSchema,
  status: publicationStatusSchema,
  scheduledAt: z.string().datetime().nullable(),
  publishedAt: z.string().datetime().nullable(),
  platformObjectId: boundedId.nullable(),
  providerWriteAllowed: z.literal(false),
}).superRefine((publication, context) => {
  const published = publication.status === "published";
  if (published !== Boolean(publication.publishedAt && publication.platformObjectId)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Published records require a timestamp and platform object ID" });
  }
});

export const socialOperationsSnapshotSchema = z.object({
  mode: z.literal("synthetic-uat"),
  publicationPlans: z.array(socialPublicationPlanSchema).min(1).max(20),
  publications: z.array(socialPublicationRecordSchema).min(1).max(20),
  analytics: z.array(socialMetricSnapshotSchema).min(1).max(20),
}).superRefine((snapshot, context) => {
  const publications = new Map(snapshot.publications.map((publication) => [publication.publicationId, publication]));
  for (const metric of snapshot.analytics) {
    const publication = publications.get(metric.publicationId);
    if (!publication || publication.status !== "published" || publication.platform !== metric.platform || !publication.publishedAt || Date.parse(metric.fetchedAt) < Date.parse(publication.publishedAt)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["analytics", metric.publicationId], message: "Analytics require a matching published record and later snapshot time" });
    }
  }
});

export const socialCalendarItemSchema = z.object({
  id: boundedId,
  masterContentId: boundedId,
  masterContentTitle: z.string().trim().min(1).max(200),
  variantId: boundedId,
  platform: socialPlatformSchema,
  format: socialMainPostFormatSchema,
  publishingMode: publishingModeSchema,
  status: publicationStatusSchema,
  scheduledAt: z.string().datetime().nullable(),
  analyticsAvailable: z.boolean(),
  providerWriteAllowed: z.literal(false),
});

export const commentSeriesPlanSchema = z.object({
  publicationId: boundedId,
  state: z.enum(["wait-main-post", "wait-approval", "ready", "complete", "invalid"]),
  nextCommentId: boundedId.nullable(),
  providerWriteAllowed: z.literal(false),
  reason: z.string().trim().min(1).max(240),
});

export function planCommentSeries(input: {
  publicationId: string;
  platform: "facebook";
  mainPostStatus: PublicationStatus;
  mainPostId: string | null;
  mode: "top-level" | "threaded";
  comments: Array<{ id: string; order: number; parentItemId: string | null; status: PublicationStatus; platformCommentId: string | null }>;
}) {
  const fail = (reason: string) => commentSeriesPlanSchema.parse({ publicationId: input.publicationId, state: "invalid", nextCommentId: null, providerWriteAllowed: false, reason });
  const comments = [...input.comments].sort((a, b) => a.order - b.order);
  const ids = new Set(comments.map((item) => item.id));
  if (ids.size !== comments.length || new Set(comments.map((item) => item.order)).size !== comments.length) return fail("Comment ID และลำดับต้องไม่ซ้ำ");
  for (const comment of comments) {
    if (comment.parentItemId && !ids.has(comment.parentItemId)) return fail("Parent comment ต้องอยู่ในชุดเดียวกัน");
    if (comment.status === "published" && !comment.platformCommentId) return fail("Comment ที่เผยแพร่แล้วต้องมี Platform ID");
    const visited = new Set([comment.id]);
    let parent = comment.parentItemId;
    while (parent) {
      if (visited.has(parent)) return fail("Comment thread มีวงจรอ้างอิง");
      visited.add(parent);
      parent = comments.find((item) => item.id === parent)?.parentItemId ?? null;
    }
  }
  if (input.mode === "top-level" && comments.some((item) => item.parentItemId)) return fail("Top-level series ต้องไม่มี parent comment");
  if (input.mode === "threaded" && comments.some((item, index) => index > 0 && item.parentItemId !== comments[index - 1]?.id)) return fail("Threaded series ต้องต่อจาก comment ก่อนหน้า");
  if (input.mainPostStatus !== "published" || !input.mainPostId) return commentSeriesPlanSchema.parse({ publicationId: input.publicationId, state: "wait-main-post", nextCommentId: null, providerWriteAllowed: false, reason: "รอ Main Post เผยแพร่และมี Platform Post ID ก่อน" });
  if (comments.some((item) => item.status !== "approved" && item.status !== "published")) return commentSeriesPlanSchema.parse({ publicationId: input.publicationId, state: "wait-approval", nextCommentId: null, providerWriteAllowed: false, reason: "ทุก Comment ต้องผ่าน Human Review ก่อน" });
  const next = comments.find((item) => item.status !== "published");
  if (!next) return commentSeriesPlanSchema.parse({ publicationId: input.publicationId, state: "complete", nextCommentId: null, providerWriteAllowed: false, reason: "Comment Series เผยแพร่ครบแล้ว" });
  if (input.mode === "threaded" && next.parentItemId && !comments.find((item) => item.id === next.parentItemId)?.platformCommentId) return fail("Parent comment ต้องเผยแพร่สำเร็จก่อน Reply ถัดไป");
  return commentSeriesPlanSchema.parse({ publicationId: input.publicationId, state: "ready", nextCommentId: next.id, providerWriteAllowed: false, reason: "พร้อมสำหรับ executor ที่ผ่านการอนุมัติ แต่ UAT นี้ยังไม่เรียก Provider" });
}

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

export const SYNTHETIC_SOCIAL_PUBLICATION_RECORDS = SYNTHETIC_SOCIAL_FOUNDATION.variants.map((variant) => {
  const published = variant.format === "live";
  return {
    publicationId: `${published ? "uat-published" : "uat-publication"}:${variant.id}`,
    variantId: variant.id,
    platform: variant.platform,
    format: variant.format,
    publishingMode: variant.publishingMode,
    status: published ? "published" as const : variant.status,
    scheduledAt: null,
    publishedAt: published ? "2026-08-28T07:00:00.000Z" : null,
    platformObjectId: published ? `synthetic-platform:${variant.id}` : null,
    providerWriteAllowed: false as const,
  };
});

export const SYNTHETIC_PUBLISHED_SOCIAL_RECORDS = SYNTHETIC_SOCIAL_PUBLICATION_RECORDS.filter(
  (publication) => publication.status === "published",
);

export const SYNTHETIC_SOCIAL_ANALYTICS = [
  {
    publicationId: "uat-published:synthetic-youtube-live-001",
    platform: "youtube",
    source: "synthetic-uat",
    fetchedAt: "2026-08-28T09:00:00.000Z",
    nativeMetrics: [
      { key: "youtube.averageConcurrentViewers", label: "Average concurrent viewers", value: 42, unit: "count", dimension: "retention" },
      { key: "youtube.peakConcurrentViewers", label: "Peak concurrent viewers", value: 87, unit: "count", dimension: "retention" },
      { key: "youtube.estimatedMinutesWatched", label: "Estimated minutes watched", value: 1260, unit: "minutes", dimension: "retention" },
    ],
    limitations: ["Fixture หลังจบ Live สำหรับ UAT ไม่ใช่ข้อมูลแบบ Real-time หรือข้อมูลจาก YouTube"],
  },
] as const;

export const SYNTHETIC_SOCIAL_OPERATIONS = socialOperationsSnapshotSchema.parse({
  mode: "synthetic-uat",
  publicationPlans: buildSyntheticPublicationPlans(),
  publications: SYNTHETIC_SOCIAL_PUBLICATION_RECORDS,
  analytics: SYNTHETIC_SOCIAL_ANALYTICS,
});

export const SYNTHETIC_COMMENT_SERIES_PLAN = planCommentSeries({
  publicationId: "uat-publication:synthetic-facebook-001",
  platform: "facebook",
  mainPostStatus: "approved",
  mainPostId: null,
  mode: SYNTHETIC_SOCIAL_FOUNDATION.variants[0]!.commentSeriesMode,
  comments: SYNTHETIC_SOCIAL_FOUNDATION.variants[0]!.commentSeries.map((item) => ({ ...item, platformCommentId: null })),
});

export function buildSyntheticContentCalendar(
  foundation = socialFoundationSnapshotSchema.parse(SYNTHETIC_SOCIAL_FOUNDATION),
  operations = SYNTHETIC_SOCIAL_OPERATIONS,
) {
  const publications = new Map(operations.publications.map((item) => [item.variantId, item]));
  const analytics = new Set(operations.analytics.map((item) => item.publicationId));
  return foundation.variants.map((variant) => {
    const publication = publications.get(variant.id);
    return socialCalendarItemSchema.parse({
      id: `uat-calendar:${variant.id}`,
      masterContentId: variant.masterContentId,
      masterContentTitle: foundation.masterContent.title,
      variantId: variant.id,
      platform: variant.platform,
      format: variant.format,
      publishingMode: variant.publishingMode,
      status: publication?.status ?? variant.status,
      scheduledAt: publication?.scheduledAt ?? null,
      analyticsAvailable: Boolean(publication && analytics.has(publication.publicationId)),
      providerWriteAllowed: false,
    });
  });
}

export function isSocialOperationsEnabled(input: {
  flag: string | undefined;
  environment: AdminEnvironment;
  projectId?: string;
  gitBranch?: string;
  sanityProjectId?: string;
  sanityDataset?: string;
  vercelEnvironment?: string;
  productionAdminProjectId?: string;
  connectionString?: string;
  neonProjectId?: string;
  neonBranchId?: string;
  neonEndpointId?: string;
  neonDatabase?: string;
}) {
  return input.flag === "1" && Boolean(resolveSocialRuntimeDescriptor(input, {
    uatBranches: [WEBSITE_42_SOCIAL_OPERATIONS_BRANCH, WEBSITE_42_SOCIAL_PROVIDER_BRANCH, WEBSITE_42_SOCIAL_ANALYTICS_BRANCH],
  }));
}

export function getSocialOperationsRuntimeStatus() {
  const runtimeInput = socialRuntimeInputFromEnvironment(process.env);
  return {
    environment: runtimeInput.environment,
    enabled: isSocialOperationsEnabled({
      flag: process.env.CCPUN_SOCIAL_OPERATIONS_ENABLED,
      ...runtimeInput,
    }),
  };
}
