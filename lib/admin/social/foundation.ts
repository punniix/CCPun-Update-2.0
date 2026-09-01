import { z } from "zod";
import { type AdminEnvironment } from "../environment";
import {
  MEDIA_OPERATIONAL_TABLES,
  mediaAssetMetadataSchema,
  mediaAssetReferenceSchema,
} from "../media/foundation";
import {
  resolveSocialRuntimeDescriptor,
  socialRuntimeInputFromEnvironment,
  SOCIAL_UAT_FOUNDATION_BRANCH,
  SOCIAL_UAT_SANITY_DATASET,
  SOCIAL_UAT_SANITY_PROJECT_ID,
} from "./runtime";

export const WEBSITE_42_SOCIAL_BRANCH = SOCIAL_UAT_FOUNDATION_BRANCH;
export const WEBSITE_42_SANITY_PROJECT_ID = SOCIAL_UAT_SANITY_PROJECT_ID;
export const WEBSITE_42_SANITY_DATASET = SOCIAL_UAT_SANITY_DATASET;

export const SOCIAL_SCHEMA_MIGRATION_VERSION = "20260828_website_42_social_foundation_v2";
export const SOCIAL_SCHEMA_MIGRATION_CHECKSUM = "sha256:b6ad0b823775df1dcfc06e0da896dfcc477cfbeae897b70e228c18a051712acb";
export const SOCIAL_FORMAT_MIGRATION_VERSION = "20260829_website_42_social_post_formats";
export const SOCIAL_FORMAT_MIGRATION_CHECKSUM = "sha256:64d8471247fa28a08fcb99cda5b4df87e73f7ed1dc497250da26d01119ade977";

export const SOCIAL_OPERATIONAL_TABLES = [
  "social_media_asset",
  "social_variant_link",
  "social_publication",
  "social_publication_job",
  "social_comment_item",
  "social_execution_audit",
] as const;

export type SocialOperationalTable = (typeof SOCIAL_OPERATIONAL_TABLES)[number];
export const SOCIAL_REQUIRED_OPERATIONAL_TABLES = [
  ...SOCIAL_OPERATIONAL_TABLES,
  ...MEDIA_OPERATIONAL_TABLES,
] as const;
export type SocialRequiredOperationalTable = (typeof SOCIAL_REQUIRED_OPERATIONAL_TABLES)[number];

export const socialPlatformSchema = z.enum([
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
  "facebook-group",
]);

export const SOCIAL_SELECTABLE_FORMATS = [
  "text-post",
  "image-post",
  "album",
  "carousel",
  "reel",
  "video",
  "short",
  "photo-post",
  "live",
] as const;

export const socialMainPostFormatSchema = z.enum(SOCIAL_SELECTABLE_FORMATS);

// comment-series remains readable for UAT compatibility, but new variants use
// a main-post format and attach Comment Series through the dedicated child field.
export const socialFormatSchema = z.enum([...SOCIAL_SELECTABLE_FORMATS, "comment-series"]);

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

export const commentSeriesModeSchema = z.enum(["top-level", "threaded"]);

export const socialVariantSchema = z.object({
  id: boundedId,
  masterContentId: boundedId,
  title: z.string().trim().min(1).max(200),
  platform: socialPlatformSchema,
  format: socialMainPostFormatSchema,
  version: z.number().int().min(1),
  publishingMode: publishingModeSchema,
  status: publicationStatusSchema,
  mediaReferences: z.array(mediaAssetReferenceSchema).max(20),
  commentSeriesMode: commentSeriesModeSchema.default("top-level"),
  commentSeries: z.array(commentSeriesItemSchema).max(20),
}).superRefine((variant, context) => {
  if (variant.platform !== "facebook" && variant.commentSeries.length > 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["commentSeries"],
      message: "Comment Series belongs to a Facebook main post only",
    });
  }
  if (variant.platform !== "facebook" && variant.commentSeriesMode !== "top-level") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["commentSeriesMode"],
      message: "Comment Series mode belongs to Facebook only",
    });
  }
});

export const socialFoundationSnapshotSchema = z.object({
  mode: z.literal("synthetic-uat"),
  masterContent: z.object({
    id: boundedId,
    title: z.string().trim().min(1).max(200),
    reviewStatus: z.literal("approved"),
  }),
  mediaAssets: z.array(mediaAssetMetadataSchema).max(40),
  variants: z.array(socialVariantSchema).min(1).max(20),
}).superRefine((snapshot, context) => {
  const assetIds = new Set(snapshot.mediaAssets.map((asset) => asset.id));
  for (const variant of snapshot.variants) {
    for (const reference of variant.mediaReferences) {
      if (!assetIds.has(reference.assetId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants", variant.id, "mediaReferences"],
          message: "Media reference must resolve to snapshot metadata",
        });
      }
    }
  }
});

export type SocialFoundationSnapshot = z.infer<typeof socialFoundationSnapshotSchema>;

export type SocialDatabaseReadiness = {
  configured: boolean;
  reachable: boolean;
  migrationCurrent: boolean;
  errorCategory: "not-configured" | "invalid-configuration" | "timeout" | "authentication" | "migration-missing" | "unavailable" | "unknown" | null;
};

export function isSocialDatabaseSchemaCurrent(input: {
  ledgerCurrent: boolean;
  formatLedgerCurrent: boolean;
  mediaLedgerCurrent: boolean;
  tables: Record<SocialRequiredOperationalTable, boolean>;
}): boolean {
  return input.ledgerCurrent
    && input.formatLedgerCurrent
    && input.mediaLedgerCurrent
    && SOCIAL_REQUIRED_OPERATIONAL_TABLES.every((table) => input.tables[table]);
}

export function isSocialDatabaseConnectionString(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      ["postgres:", "postgresql:"].includes(url.protocol) &&
      Boolean(url.username && url.password) &&
      url.hostname.endsWith(".neon.tech")
    );
  } catch {
    return false;
  }
}

export function classifySocialDatabaseError(error: unknown): SocialDatabaseReadiness {
  const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
    ? error.code
    : undefined;
  const name = typeof error === "object" && error !== null && "name" in error && typeof error.name === "string"
    ? error.name
    : undefined;
  if (name === "AbortError" || name === "TimeoutError") {
    return { configured: true, reachable: false, migrationCurrent: false, errorCategory: "timeout" };
  }
  if (code?.startsWith("28")) {
    return { configured: true, reachable: false, migrationCurrent: false, errorCategory: "authentication" };
  }
  if (code === "3F000" || code === "42P01") {
    return { configured: true, reachable: true, migrationCurrent: false, errorCategory: "migration-missing" };
  }
  if (code === "57P03" || code?.startsWith("08")) {
    return { configured: true, reachable: false, migrationCurrent: false, errorCategory: "unavailable" };
  }
  return { configured: true, reachable: false, migrationCurrent: false, errorCategory: "unknown" };
}

export function isSocialFoundationEnabled(input: {
  flag: string | undefined;
  dataMode: string | undefined;
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
}): boolean {
  const runtime = resolveSocialRuntimeDescriptor(input, { uatBranches: [WEBSITE_42_SOCIAL_BRANCH] });
  return input.flag === "1"
    && runtime?.lane === "uat"
    && input.dataMode === "synthetic";
}

export function getSocialFoundationRuntimeStatus() {
  const runtimeInput = socialRuntimeInputFromEnvironment(process.env);

  return {
    environment: runtimeInput.environment,
    gitBranch: runtimeInput.gitBranch ?? null,
    enabled: isSocialFoundationEnabled({
      flag: process.env.CCPUN_SOCIAL_ENABLED,
      dataMode: process.env.CCPUN_SOCIAL_DATA_MODE,
      ...runtimeInput,
    }),
  };
}

export const SYNTHETIC_SOCIAL_FOUNDATION: SocialFoundationSnapshot = {
  mode: "synthetic-uat",
  masterContent: {
    id: "synthetic-master-001",
    title: "ประกันสุขภาพทำตอนป่วยแล้วใช้ได้เลยไหม",
    reviewStatus: "approved",
  },
  mediaAssets: [
    {
      id: "synthetic-media-001",
      kind: "image",
      originalFilename: "synthetic-health-cover.webp",
      mimeType: "image/webp",
      byteSize: 128_000,
      widthPx: 1_080,
      heightPx: 1_350,
      durationMs: null,
      checksumSha256: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      lifecycleState: "registered",
    },
  ],
  variants: [
    {
      id: "synthetic-facebook-001",
      masterContentId: "synthetic-master-001",
      title: "Facebook post พร้อม Comment Series",
      platform: "facebook",
      format: "image-post",
      version: 1,
      publishingMode: "native-scheduled",
      status: "approved",
      mediaReferences: [{ assetId: "synthetic-media-001", role: "primary", order: null }],
      commentSeriesMode: "top-level",
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
      mediaReferences: [],
      commentSeriesMode: "top-level",
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
      mediaReferences: [],
      commentSeriesMode: "top-level",
      commentSeries: [],
    },
    {
      id: "synthetic-youtube-001",
      masterContentId: "synthetic-master-001",
      title: "YouTube Short ที่พร้อมส่งเข้า Native Scheduler",
      platform: "youtube",
      format: "short",
      version: 1,
      publishingMode: "native-scheduled",
      status: "approved",
      mediaReferences: [],
      commentSeriesMode: "top-level",
      commentSeries: [],
    },
    {
      id: "synthetic-youtube-live-001",
      masterContentId: "synthetic-master-001",
      title: "YouTube Live สำหรับทดสอบสถิติย้อนหลัง",
      platform: "youtube",
      format: "live",
      version: 1,
      publishingMode: "native-scheduled",
      status: "approved",
      mediaReferences: [],
      commentSeriesMode: "top-level",
      commentSeries: [],
    },
  ],
};
