import { z } from "zod";
import { type AdminEnvironment } from "../environment";
import {
  resolveSocialRuntime,
  resolveSocialRuntimeDescriptor,
  socialRuntimeInputFromEnvironment,
  SOCIAL_UAT_ANALYTICS_BRANCH,
  SOCIAL_UAT_SANITY_DATASET,
  SOCIAL_UAT_SANITY_PROJECT_ID,
} from "../social/runtime";

export const WEBSITE_42_MEDIA_LIBRARY_BRANCH = SOCIAL_UAT_ANALYTICS_BRANCH;
export const WEBSITE_42_MEDIA_SANITY_PROJECT_ID = SOCIAL_UAT_SANITY_PROJECT_ID;
export const WEBSITE_42_MEDIA_SANITY_DATASET = SOCIAL_UAT_SANITY_DATASET;

export const MEDIA_SCHEMA_MIGRATION_VERSION = "20260828_website_42_media_library_foundation";
export const MEDIA_SCHEMA_MIGRATION_CHECKSUM = "sha256:9c5a76125a6cecc90a1693aabd7925c04f8473de0fa0d3206b6188fb427bfb55";

export const MEDIA_OPERATIONAL_TABLES = [
  "media_storage_object",
  "media_upload_session",
  "social_variant_media",
] as const;

export const mediaIdSchema = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_.:-]+$/);

const originalFilenameSchema = z.string()
  .min(1)
  .max(255)
  .refine((value) => !/[\u0000-\u001F\u007F-\u009F]/u.test(value), "Filename must not contain a control character")
  .transform((value) => value.trim())
  .pipe(z.string().min(1).max(255).refine(
    (value) => !value.includes("/") && !value.includes("\\"),
    "Filename must not contain a path",
  ));

const mediaAssetMetadataObjectSchema = z.strictObject({
  id: mediaIdSchema,
  kind: z.enum(["image", "video", "caption"]),
  originalFilename: originalFilenameSchema,
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "video/mp4", "text/vtt"]),
  byteSize: z.number().int().min(1).max(5_000_000_000),
  widthPx: z.number().int().min(1).max(32_768).nullable(),
  heightPx: z.number().int().min(1).max(32_768).nullable(),
  durationMs: z.number().int().min(1).max(86_400_000).nullable(),
  checksumSha256: z.string().regex(/^[0-9a-f]{64}$/),
  lifecycleState: z.enum(["registered", "ready", "archived"]),
});

function validateMediaShape(
  asset: Pick<z.infer<typeof mediaAssetMetadataObjectSchema>, "kind" | "mimeType" | "widthPx" | "heightPx" | "durationMs">,
  context: z.RefinementCtx,
) {
  const validShape =
    (asset.kind === "image" && asset.mimeType.startsWith("image/") && asset.widthPx !== null && asset.heightPx !== null && asset.durationMs === null) ||
    (asset.kind === "video" && asset.mimeType === "video/mp4" && asset.widthPx !== null && asset.heightPx !== null && asset.durationMs !== null) ||
    (asset.kind === "caption" && asset.mimeType === "text/vtt" && asset.widthPx === null && asset.heightPx === null && asset.durationMs === null);
  if (!validShape) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Media metadata must match its asset kind" });
  }
}

export const mediaAssetMetadataSchema = mediaAssetMetadataObjectSchema.superRefine(validateMediaShape);

export const mediaAssetReferenceSchema = z.object({
  assetId: mediaIdSchema,
  role: z.enum(["primary", "carousel-item", "cover", "thumbnail", "caption"]),
  order: z.number().int().min(1).max(20).nullable(),
}).superRefine((reference, context) => {
  if ((reference.role === "carousel-item") !== (reference.order !== null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Only carousel items use an explicit order" });
  }
});

export const mediaUploadIntentRequestSchema = mediaAssetMetadataObjectSchema
  .omit({ id: true, lifecycleState: true })
  .extend({
    idempotencyKey: z.string().trim().min(16).max(200).regex(/^[A-Za-z0-9_.:-]+$/),
  })
  .superRefine(validateMediaShape);

export const mediaUploadSessionSchema = z.object({
  id: mediaIdSchema,
  assetId: mediaIdSchema,
  uploadMethod: z.literal("direct"),
  provider: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/).nullable(),
  status: z.enum(["blocked", "requested", "authorized", "uploading", "uploaded", "verified", "failed", "expired", "cancelled"]),
  idempotencyKey: z.string().trim().min(16).max(200).regex(/^[A-Za-z0-9_.:-]+$/),
  errorCategory: z.enum(["storage-not-configured", "invalid-input", "expired", "provider-unavailable", "unknown"]).nullable(),
}).superRefine((session, context) => {
  if (session.status === "blocked" && (session.provider !== null || session.errorCategory === null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Blocked sessions require a sanitized error and no provider" });
  }
});

export const mediaLibrarySnapshotSchema = z.object({
  mode: z.literal("synthetic-uat"),
  assets: z.array(mediaAssetMetadataSchema).min(1).max(40),
  uploadSessions: z.array(mediaUploadSessionSchema).max(40),
});

export type MediaLibrarySnapshot = z.infer<typeof mediaLibrarySnapshotSchema>;
export type MediaUploadIntentRequest = z.infer<typeof mediaUploadIntentRequestSchema>;

export type MediaStorageProviderState =
  | { provider: null; status: "not-connected"; directUploadAvailable: false }
  | { provider: string; status: "ready"; directUploadAvailable: true };

export function getMediaStorageProviderState(): MediaStorageProviderState {
  return { provider: null, status: "not-connected", directUploadAvailable: false };
}

export function isMediaLibraryEnabled(input: {
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
}): boolean {
  const runtime = resolveSocialRuntimeDescriptor(input, { uatBranches: [WEBSITE_42_MEDIA_LIBRARY_BRANCH] });
  return input.flag === "1" && runtime?.lane === "uat";
}

export function getMediaLibraryRuntimeStatus() {
  const runtimeInput = socialRuntimeInputFromEnvironment(process.env);

  return {
    environment: runtimeInput.environment,
    gitBranch: runtimeInput.gitBranch ?? null,
    enabled: isMediaLibraryEnabled({
      flag: process.env.CCPUN_MEDIA_LIBRARY_ENABLED,
      ...runtimeInput,
    }),
  };
}

export function resolveGoogleDriveSelectedFileVerificationRuntime(
  env: Record<string, string | undefined> = process.env,
) {
  if (env.CCPUN_MEDIA_LIBRARY_ENABLED !== "1") return null;
  return resolveSocialRuntime(env, { uatBranches: [WEBSITE_42_MEDIA_LIBRARY_BRANCH] });
}

export function isGoogleDriveSelectedFileVerificationEnabled(
  env: Record<string, string | undefined> = process.env,
) {
  return Boolean(resolveGoogleDriveSelectedFileVerificationRuntime(env));
}

export const SYNTHETIC_MEDIA_LIBRARY: MediaLibrarySnapshot = {
  mode: "synthetic-uat",
  assets: [
    {
      id: "synthetic-media-image-001",
      kind: "image",
      originalFilename: "health-carousel-cover.webp",
      mimeType: "image/webp",
      byteSize: 128_000,
      widthPx: 1_080,
      heightPx: 1_350,
      durationMs: null,
      checksumSha256: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      lifecycleState: "registered",
    },
    {
      id: "synthetic-media-video-001",
      kind: "video",
      originalFilename: "waiting-period-reel.mp4",
      mimeType: "video/mp4",
      byteSize: 24_000_000,
      widthPx: 1_080,
      heightPx: 1_920,
      durationMs: 42_000,
      checksumSha256: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      lifecycleState: "registered",
    },
  ],
  uploadSessions: [
    {
      id: "synthetic-upload-blocked-001",
      assetId: "synthetic-media-video-001",
      uploadMethod: "direct",
      provider: null,
      status: "blocked",
      idempotencyKey: "synthetic:media-upload:001",
      errorCategory: "storage-not-configured",
    },
  ],
};
