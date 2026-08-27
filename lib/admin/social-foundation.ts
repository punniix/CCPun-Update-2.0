import { z } from "zod";
import {
  CCPUN_VERCEL_PROJECT_IDS,
  getAdminEnvironment,
  type AdminEnvironment,
} from "./environment";

export const WEBSITE_42_SOCIAL_BRANCH = "codex/website-42-social-foundation";

export const socialPlatformSchema = z.enum([
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
  "facebook-group",
]);

export const socialFormatSchema = z.enum([
  "text-post",
  "image-post",
  "carousel",
  "comment-series",
  "reel",
  "video",
  "short",
  "photo-post",
]);

export const publishingModeSchema = z.enum([
  "direct",
  "native-scheduled",
  "native-finish",
  "tiktok-draft",
  "assisted-distribution",
]);

export const publicationStatusSchema = z.enum([
  "draft",
  "approved",
  "queued",
  "native-scheduled",
  "awaiting-native-finish",
  "processing",
  "published",
  "failed",
  "cancelled",
  "superseded",
]);

export type PublicationStatus = z.infer<typeof publicationStatusSchema>;

const PUBLICATION_TRANSITIONS: Readonly<Record<PublicationStatus, ReadonlySet<PublicationStatus>>> = {
  draft: new Set(["approved", "cancelled", "superseded"]),
  approved: new Set(["queued", "native-scheduled", "awaiting-native-finish", "cancelled", "superseded"]),
  queued: new Set(["processing", "cancelled", "superseded"]),
  "native-scheduled": new Set(["published", "failed", "cancelled", "superseded"]),
  "awaiting-native-finish": new Set(["published", "cancelled", "superseded"]),
  processing: new Set(["published", "failed", "cancelled"]),
  published: new Set(),
  failed: new Set(["queued", "cancelled", "superseded"]),
  cancelled: new Set(),
  superseded: new Set(),
};

export function canTransitionPublicationStatus(from: PublicationStatus, to: PublicationStatus): boolean {
  return PUBLICATION_TRANSITIONS[from].has(to);
}

const boundedId = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_.:-]+$/);

export const commentSeriesItemSchema = z.object({
  id: boundedId,
  order: z.number().int().min(1).max(20),
  text: z.string().trim().min(1).max(2_000),
  parentItemId: boundedId.nullable(),
  status: publicationStatusSchema,
});

export const socialVariantSchema = z.object({
  id: boundedId,
  masterContentId: boundedId,
  title: z.string().trim().min(1).max(200),
  platform: socialPlatformSchema,
  format: socialFormatSchema,
  version: z.number().int().min(1),
  publishingMode: publishingModeSchema,
  status: publicationStatusSchema,
  mediaAssetIds: z.array(boundedId).max(20),
  commentSeries: z.array(commentSeriesItemSchema).max(20),
});

export const socialFoundationSnapshotSchema = z.object({
  mode: z.literal("synthetic-uat"),
  masterContent: z.object({
    id: boundedId,
    title: z.string().trim().min(1).max(200),
    reviewStatus: z.literal("approved"),
  }),
  variants: z.array(socialVariantSchema).min(1).max(20),
});

export type SocialFoundationSnapshot = z.infer<typeof socialFoundationSnapshotSchema>;

export function isSocialFoundationEnabled(input: {
  flag: string | undefined;
  dataMode: string | undefined;
  environment: AdminEnvironment;
  projectId: string | undefined;
  gitBranch: string | undefined;
}): boolean {
  return (
    input.flag === "1" &&
    input.dataMode === "synthetic" &&
    input.environment === "admin-uat" &&
    input.projectId === CCPUN_VERCEL_PROJECT_IDS.adminProduction &&
    input.gitBranch === WEBSITE_42_SOCIAL_BRANCH
  );
}

export function getSocialFoundationRuntimeStatus() {
  const environment = getAdminEnvironment();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim() || process.env.NEXT_PUBLIC_CCPUN_VERCEL_PROJECT_ID?.trim();
  const gitBranch = process.env.VERCEL_GIT_COMMIT_REF?.trim();

  return {
    environment,
    gitBranch: gitBranch ?? null,
    enabled: isSocialFoundationEnabled({
      flag: process.env.CCPUN_SOCIAL_ENABLED,
      dataMode: process.env.CCPUN_SOCIAL_DATA_MODE,
      environment,
      projectId,
      gitBranch,
    }),
    databaseConfigured: Boolean(process.env.CCPUN_SOCIAL_DATABASE_URL?.trim()),
  };
}

export const SYNTHETIC_SOCIAL_FOUNDATION: SocialFoundationSnapshot = {
  mode: "synthetic-uat",
  masterContent: {
    id: "synthetic-master-001",
    title: "ประกันสุขภาพทำตอนป่วยแล้วใช้ได้เลยไหม",
    reviewStatus: "approved",
  },
  variants: [
    {
      id: "synthetic-facebook-001",
      masterContentId: "synthetic-master-001",
      title: "Facebook post พร้อม Comment Series",
      platform: "facebook",
      format: "comment-series",
      version: 1,
      publishingMode: "native-scheduled",
      status: "approved",
      mediaAssetIds: [],
      commentSeries: [
        {
          id: "synthetic-comment-001",
          order: 1,
          text: "ข้อมูลตัวอย่างสำหรับ UAT เท่านั้น",
          parentItemId: null,
          status: "approved",
        },
      ],
    },
    {
      id: "synthetic-instagram-001",
      masterContentId: "synthetic-master-001",
      title: "Instagram Reel ที่ต้องจบงานในแอป",
      platform: "instagram",
      format: "reel",
      version: 1,
      publishingMode: "native-finish",
      status: "awaiting-native-finish",
      mediaAssetIds: ["synthetic-media-001"],
      commentSeries: [],
    },
    {
      id: "synthetic-tiktok-001",
      masterContentId: "synthetic-master-001",
      title: "TikTok Draft สำหรับแต่งเสียงในแอป",
      platform: "tiktok",
      format: "short",
      version: 1,
      publishingMode: "tiktok-draft",
      status: "draft",
      mediaAssetIds: ["synthetic-media-001"],
      commentSeries: [],
    },
  ],
};
