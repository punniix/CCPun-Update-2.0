import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import {
  fetchGoogleDriveSelectedFileBinary,
  googleDriveInteractiveAuthorizationSchema,
  googleDriveSelectedFileRequestSchema,
  parseGoogleDriveApprovedRootFolderIds,
} from "../media/google-drive-foundation";
import {
  SOCIAL_PUBLICATION_EXECUTION_MIGRATION_CHECKSUM,
  SOCIAL_PUBLICATION_EXECUTION_MIGRATION_VERSION,
  SOCIAL_PUBLICATION_UAT_NEON,
  authorizeSocialProviderExecution,
  isSocialProviderExecutionGateEnabled,
} from "./publishing";
import {
  type ApprovedMetaMediaDescriptor,
  publishFacebookPageContent,
} from "./providers/meta/publishing";

if (typeof window !== "undefined") throw new Error("SOCIAL_EXECUTION_STORE_SERVER_ONLY");

const boundedId = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_.:-]+$/);
const jobStatusSchema = z.enum(["queued", "processing", "succeeded", "failed", "cancelled"]);
const publicationStatusSchema = z.enum([
  "draft", "approved", "queued", "native-scheduled", "awaiting-native-finish",
  "processing", "published", "failed", "cancelled", "superseded",
]);
const executionTargetSchema = z.enum([
  "facebook-publish-now",
  "facebook-native-scheduled",
  "instagram-publish-now",
  "instagram-mobile-handoff",
]);

export const socialPublicationExecuteRequestSchema = z.strictObject({
  publicationId: boundedId,
  expectedJobVersion: z.number().int().min(1),
  driveMedia: z.strictObject({
    accessToken: googleDriveSelectedFileRequestSchema.shape.accessToken,
    authorization: googleDriveInteractiveAuthorizationSchema,
    files: z.array(z.strictObject({
      assetId: boundedId,
      expectedMimeType: z.enum(["image/jpeg", "image/png", "image/webp", "video/mp4"]),
      expectedByteSize: z.number().int().min(1).max(1_000_000_000),
      expectedSha256: z.string().regex(/^[0-9a-f]{64}$/),
    })).min(1).max(10),
  }).optional(),
});

const executionRowsSchema = z.array(z.object({
  publication_id: boundedId,
  variant_id: boundedId,
  publication_status: publicationStatusSchema,
  execution_target: executionTargetSchema,
  scheduled_at: z.coerce.date().nullable(),
  platform_object_id: z.string().trim().min(1).max(200).nullable(),
  published_at: z.coerce.date().nullable(),
  approved_revision: z.string().trim().min(1).max(120),
  approved_version: z.number().int().min(1),
  approved_at: z.coerce.date(),
  approval_request_ref: boundedId,
  publication_idempotency_key: z.string().trim().min(16).max(200),
  channel: z.enum(["facebook", "instagram"]),
  format: z.enum(["text-post", "link-post", "image-post", "album", "carousel", "reel", "video", "photo-post"]),
  publishing_mode: z.enum(["direct", "native-scheduled", "native-finish"]),
  job_id: boundedId,
  job_type: z.enum(["publish", "native-handoff"]),
  job_status: jobStatusSchema,
  job_version: z.number().int().min(1),
  attempt_count: z.number().int().min(0).max(10),
  max_attempts: z.number().int().min(1).max(10),
  lock_owner: boundedId.nullable(),
  lock_expires_at: z.coerce.date().nullable(),
  job_idempotency_key: z.string().trim().min(16).max(200),
  last_error_category: z.enum(["authentication", "authorization", "rate-limit", "timeout", "provider-unavailable", "invalid-request", "conflict", "unknown"]).nullable(),
})).max(1);

const claimedRowsSchema = z.array(z.object({
  job_id: boundedId,
  version: z.number().int().min(2),
  attempt_count: z.number().int().min(1).max(10),
  max_attempts: z.number().int().min(1).max(10),
  lock_owner: boundedId,
  lock_expires_at: z.coerce.date(),
})).max(1);
const stateChangeRowsSchema = z.array(z.object({ publication_id: boundedId })).max(1);

type SqlLike = { query: (query: string, params?: unknown[]) => Promise<unknown> };
type ApprovedVariant = {
  variantId: string;
  revision: string;
  version: number;
  platform: "facebook" | "instagram";
  format: "text-post" | "link-post" | "image-post" | "album" | "carousel" | "reel" | "video" | "short" | "photo-post" | "live";
  publishingMode: "direct" | "native-scheduled" | "native-finish";
  caption: string | null;
  linkUrl: string | null;
  mediaMetadata: Array<{
    assetId: string;
    role: "primary" | "carousel-item" | "cover" | "thumbnail" | "caption";
    order: number | null;
    mimeType: "image/jpeg" | "image/png" | "image/webp" | "video/mp4" | "text/vtt" | null;
    sha256Checksum: string | null;
    widthPx: number | null;
    heightPx: number | null;
    durationMs: number | null;
  }>;
};
type ExecutionDependencies = {
  sql?: SqlLike;
  readVariant?: (variantId: string, env: Record<string, string | undefined>) => Promise<ApprovedVariant | null>;
  fetcher?: typeof fetch;
  fetchDriveBinary?: typeof fetchGoogleDriveSelectedFileBinary;
  now?: () => Date;
};

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function safeActorRef(actor: string) {
  return `admin:${digest(actor).slice(0, 32)}`;
}

export function isSocialProviderExecutionEnabled(env: Record<string, string | undefined> = process.env) {
  return isSocialProviderExecutionGateEnabled(env);
}

async function verifiedSql(env: Record<string, string | undefined>) {
  if (!isSocialProviderExecutionEnabled(env)) throw new Error("SOCIAL_PROVIDER_WRITES_NOT_CONFIGURED");
  const sql = neon(env.CCPUN_SOCIAL_DATABASE_URL!.trim(), { fetchOptions: { signal: AbortSignal.timeout(15_000) } });
  const rows = z.array(z.object({
    database_name: z.string(), role_name: z.string(), ledger_current: z.boolean(), identity_current: z.boolean(),
  })).max(1).parse(await sql.query(
    `SELECT current_database() AS database_name,current_user AS role_name,
       EXISTS (SELECT 1 FROM ccpun_social.schema_migration WHERE version=$1 AND checksum=$2) AS ledger_current,
       EXISTS (SELECT 1 FROM ccpun_social.system_identity WHERE singleton=true AND project_id=$3 AND branch_id=$4
         AND endpoint_id=$5 AND database_name=$6) AS identity_current`,
    [SOCIAL_PUBLICATION_EXECUTION_MIGRATION_VERSION, SOCIAL_PUBLICATION_EXECUTION_MIGRATION_CHECKSUM,
      SOCIAL_PUBLICATION_UAT_NEON.projectId, SOCIAL_PUBLICATION_UAT_NEON.branchId,
      SOCIAL_PUBLICATION_UAT_NEON.endpointId, SOCIAL_PUBLICATION_UAT_NEON.database],
  ));
  const row = rows[0];
  if (!row || row.database_name !== SOCIAL_PUBLICATION_UAT_NEON.database || row.role_name !== SOCIAL_PUBLICATION_UAT_NEON.role
    || !row.ledger_current || !row.identity_current) throw new Error("SOCIAL_PROVIDER_WRITES_IDENTITY_MISMATCH");
  return sql as SqlLike;
}

async function loadExecution(sql: SqlLike, publicationId: string) {
  return executionRowsSchema.parse(await sql.query(
    `/* social-execution:load */
     SELECT publication.id AS publication_id,publication.variant_id,publication.status AS publication_status,
       publication.execution_target,publication.scheduled_at,publication.platform_object_id,publication.published_at,
       publication.approved_revision,publication.approved_version,publication.approved_at,publication.approval_request_ref,
       publication.idempotency_key AS publication_idempotency_key,
       variant.channel,variant.format,variant.publishing_mode,
       job.id AS job_id,job.job_type,job.status AS job_status,job.version AS job_version,
       job.attempt_count,job.max_attempts,job.lock_owner,job.lock_expires_at,
       job.idempotency_key AS job_idempotency_key,job.last_error_category
     FROM ccpun_social.social_publication AS publication
     JOIN ccpun_social.social_variant_link AS variant ON variant.variant_id=publication.variant_id
     JOIN ccpun_social.social_publication_job AS job ON job.publication_id=publication.id
     WHERE publication.id=$1 ORDER BY job.created_at DESC LIMIT 1`,
    [publicationId],
  ))[0] ?? null;
}

async function claimExecution(sql: SqlLike, input: {
  publicationId: string; jobId: string; expectedVersion: number; workerId: string;
  now: string; lockExpiresAt: string; actorRef: string; requestId: string;
}) {
  return claimedRowsSchema.parse(await sql.query(
    `/* social-execution:claim */
     WITH eligible_publication AS MATERIALIZED (
       SELECT id FROM ccpun_social.social_publication
       WHERE id=$1 AND status IN ('approved','failed') FOR UPDATE
     ), claimed_job AS (
       UPDATE ccpun_social.social_publication_job SET status='processing',version=version+1,
         attempt_count=attempt_count+1,lock_owner=$4,locked_at=$5::timestamptz,
         lock_expires_at=$6::timestamptz,last_error_category=NULL,last_error_ref=NULL,updated_at=now()
       WHERE id=$2 AND publication_id=$1 AND version=$3 AND attempt_count<max_attempts
         AND (status='queued' OR (status='failed' AND last_error_category='rate-limit'))
         AND EXISTS (SELECT 1 FROM eligible_publication)
       RETURNING id AS job_id,version,attempt_count,max_attempts,lock_owner,lock_expires_at
     ), claimed_publication AS (
       UPDATE ccpun_social.social_publication SET status='processing',updated_at=now()
       WHERE id IN (SELECT id FROM eligible_publication) AND EXISTS (SELECT 1 FROM claimed_job)
       RETURNING id
     ), audit AS (
       INSERT INTO ccpun_social.social_execution_audit
         (id,actor_type,actor_ref,action,object_type,object_id,request_ref,outcome)
       SELECT $7,'human',$8,'publication:execute','publication',$1,$9,'allowed'
       FROM claimed_publication ON CONFLICT (id) DO NOTHING RETURNING id
     )
     SELECT job_id,version,attempt_count,max_attempts,lock_owner,lock_expires_at
     FROM claimed_job WHERE EXISTS (SELECT 1 FROM claimed_publication)`,
    [input.publicationId, input.jobId, input.expectedVersion, input.workerId, input.now, input.lockExpiresAt,
      `audit:${input.requestId}:claim`, input.actorRef, input.requestId],
  ))[0] ?? null;
}

async function finishExecution(sql: SqlLike, input: {
  publicationId: string; jobId: string; claimedVersion: number; workerId: string; platformObjectId: string;
  status: "published" | "native-scheduled"; publishedAt: string | null; actorRef: string; requestId: string;
}) {
  return stateChangeRowsSchema.parse(await sql.query(
    `/* social-execution:finish */
     WITH eligible_publication AS MATERIALIZED (
       SELECT id FROM ccpun_social.social_publication WHERE id=$1 AND status='processing' FOR UPDATE
     ), completed_job AS (
       UPDATE ccpun_social.social_publication_job SET status='succeeded',version=version+1,
         lock_owner=NULL,locked_at=NULL,lock_expires_at=NULL,last_error_category=NULL,last_error_ref=NULL,updated_at=now()
       WHERE id=$2 AND publication_id=$1 AND status='processing' AND version=$3 AND lock_owner=$4
         AND EXISTS (SELECT 1 FROM eligible_publication)
       RETURNING publication_id
     ), completed_publication AS (
       UPDATE ccpun_social.social_publication SET status=$5,platform_object_id=$6,published_at=$7::timestamptz,updated_at=now()
       WHERE id IN (SELECT id FROM eligible_publication) AND EXISTS (SELECT 1 FROM completed_job)
       RETURNING id AS publication_id
     ), audit AS (
       INSERT INTO ccpun_social.social_execution_audit
         (id,actor_type,actor_ref,action,object_type,object_id,request_ref,outcome)
       SELECT $8,'human',$9,'publication:execute','publication',$1,$10,'succeeded'
       FROM completed_publication ON CONFLICT (id) DO NOTHING RETURNING id
     )
     SELECT publication_id FROM completed_publication`,
    [input.publicationId, input.jobId, input.claimedVersion, input.workerId, input.status,
      input.platformObjectId, input.publishedAt, `audit:${input.requestId}:result`, input.actorRef, input.requestId],
  ))[0] ?? null;
}

async function failExecution(sql: SqlLike, input: {
  publicationId: string; jobId: string; claimedVersion: number; workerId: string;
  category: "authentication" | "authorization" | "rate-limit" | "timeout" | "provider-unavailable" | "invalid-request" | "conflict" | "unknown";
  actorRef: string; requestId: string;
}) {
  return stateChangeRowsSchema.parse(await sql.query(
    `/* social-execution:fail */
     WITH eligible_publication AS MATERIALIZED (
       SELECT id FROM ccpun_social.social_publication WHERE id=$1 AND status='processing' FOR UPDATE
     ), failed_job AS (
       UPDATE ccpun_social.social_publication_job SET status='failed',version=version+1,
         lock_owner=NULL,locked_at=NULL,lock_expires_at=NULL,last_error_category=$5,last_error_ref=$6,updated_at=now()
       WHERE id=$2 AND publication_id=$1 AND status='processing' AND version=$3 AND lock_owner=$4
         AND EXISTS (SELECT 1 FROM eligible_publication)
       RETURNING publication_id
     ), failed_publication AS (
       UPDATE ccpun_social.social_publication SET status='failed',updated_at=now()
       WHERE id IN (SELECT id FROM eligible_publication) AND EXISTS (SELECT 1 FROM failed_job)
       RETURNING id AS publication_id
     ), audit AS (
       INSERT INTO ccpun_social.social_execution_audit
         (id,actor_type,actor_ref,action,object_type,object_id,request_ref,outcome)
       SELECT $7,'human',$8,'publication:execute','publication',$1,$9,'failed'
       FROM failed_publication ON CONFLICT (id) DO NOTHING RETURNING id
     )
     SELECT publication_id FROM failed_publication`,
    [input.publicationId, input.jobId, input.claimedVersion, input.workerId, input.category, input.requestId,
      `audit:${input.requestId}:result`, input.actorRef, input.requestId],
  ))[0] ?? null;
}

async function recordDenied(sql: SqlLike, publicationId: string, actorRef: string, requestId: string) {
  await sql.query(
    `/* social-execution:deny */
     INSERT INTO ccpun_social.social_execution_audit
       (id,actor_type,actor_ref,action,object_type,object_id,request_ref,outcome)
     VALUES ($1,'human',$2,'publication:execute','publication',$3,$4,'denied')
     ON CONFLICT (id) DO NOTHING`,
    [`audit:${requestId}:denied`, actorRef, publicationId, requestId],
  );
}

function failure(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "META_API_AUTH_REQUIRED") return { code, category: "authentication" as const };
  if (code === "META_API_SCOPE_REQUIRED") return { code, category: "authorization" as const };
  if (code === "META_API_RATE_LIMITED") return { code, category: "rate-limit" as const };
  if (code === "META_API_TIMEOUT") return { code, category: "timeout" as const };
  if (code === "META_API_UNAVAILABLE") return { code, category: "provider-unavailable" as const };
  if (code.startsWith("SOCIAL_EXECUTION_EDITORIAL_") || code === "SOCIAL_EXECUTION_AUTHORIZATION_DENIED"
    || code === "SOCIAL_EXECUTION_TRUSTED_MEDIA_REQUIRED" || code === "SOCIAL_EXECUTION_UNSUPPORTED_FORMAT") {
    return { code, category: "conflict" as const };
  }
  if (code.startsWith("META_") || error instanceof z.ZodError) return { code: "SOCIAL_EXECUTION_INVALID_PROVIDER_REQUEST", category: "invalid-request" as const };
  return { code: "SOCIAL_EXECUTION_FAILED", category: "unknown" as const };
}

function approvedFacebookContent(variant: ApprovedVariant, resolvedMedia: ApprovedMetaMediaDescriptor[] = []) {
  const message = variant.caption?.trim() || undefined;
  if (variant.format === "text-post") {
    if (!message || variant.mediaMetadata.length > 0 || variant.linkUrl !== null) throw new Error("SOCIAL_EXECUTION_EDITORIAL_UNSUPPORTED");
    return { format: "text-post" as const, message };
  }
  if (variant.format === "link-post") {
    if (variant.mediaMetadata.length > 0 || !variant.linkUrl) throw new Error("SOCIAL_EXECUTION_EDITORIAL_UNSUPPORTED");
    let link: URL;
    try { link = new URL(variant.linkUrl); } catch { throw new Error("SOCIAL_EXECUTION_EDITORIAL_UNSUPPORTED"); }
    if (link.protocol !== "https:") throw new Error("SOCIAL_EXECUTION_EDITORIAL_UNSUPPORTED");
    return { format: "link-post" as const, linkUrl: link.toString(), ...(message ? { message } : {}) };
  }

  const canonicalFormat = variant.format === "photo-post" ? "image-post"
    : variant.format === "carousel" ? "album"
      : variant.format;
  if (!["image-post", "album", "video", "reel"].includes(canonicalFormat)) {
    throw new Error("SOCIAL_EXECUTION_UNSUPPORTED_FORMAT");
  }
  const ordered = [...variant.mediaMetadata].sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
  if (canonicalFormat === "image-post") {
    if (ordered.length !== 1 || !ordered[0]!.mimeType?.startsWith("image/")) throw new Error("SOCIAL_EXECUTION_EDITORIAL_UNSUPPORTED");
  } else if (canonicalFormat === "album") {
    if (ordered.length < 2 || ordered.length > 10
      || ordered.some((media, index) => media.order !== index + 1 || !media.mimeType?.startsWith("image/"))) {
      throw new Error("SOCIAL_EXECUTION_EDITORIAL_UNSUPPORTED");
    }
  } else if (ordered.length !== 1 || ordered[0]!.mimeType !== "video/mp4") {
    throw new Error("SOCIAL_EXECUTION_EDITORIAL_UNSUPPORTED");
  }
  if (resolvedMedia.length !== ordered.length || resolvedMedia.some((media, index) => (
    media.assetId !== ordered[index]!.assetId
    || media.mimeType !== ordered[index]!.mimeType
    || media.order !== index + 1
    || media.approvedRevision !== variant.revision
    || media.approvedVersion !== variant.version
  ))) throw new Error("SOCIAL_EXECUTION_TRUSTED_MEDIA_REQUIRED");
  if (canonicalFormat === "image-post") {
    return { format: "image-post" as const, media: resolvedMedia[0]!, ...(message ? { message } : {}) };
  }
  if (canonicalFormat === "album") {
    return { format: "album" as const, media: resolvedMedia, ...(message ? { message } : {}) };
  }
  if (canonicalFormat === "video") {
    return { format: "video" as const, media: resolvedMedia[0]!, ...(message ? { message } : {}) };
  }
  return { format: "reel" as const, media: resolvedMedia[0]!, ...(message ? { message } : {}) };
}

async function resolveApprovedDriveMedia(input: {
  request: z.infer<typeof socialPublicationExecuteRequestSchema>;
  variant: ApprovedVariant;
  env: Record<string, string | undefined>;
  now: Date;
  dependency?: typeof fetchGoogleDriveSelectedFileBinary;
}) {
  if (input.variant.mediaMetadata.length === 0) return [];
  const drive = input.request.driveMedia;
  const rootFolderIds = parseGoogleDriveApprovedRootFolderIds([
    input.env.CCPUN_GOOGLE_DRIVE_ADMIN_ROOT_FOLDER_ID,
    input.env.CCPUN_GOOGLE_DRIVE_MEDIA_ROOT_FOLDER_ID,
  ]);
  if (!drive || !rootFolderIds || rootFolderIds.length !== 2) throw new Error("SOCIAL_EXECUTION_TRUSTED_MEDIA_REQUIRED");
  const files = new Map(drive.files.map((file) => [file.assetId, file]));
  if (files.size !== drive.files.length || files.size !== input.variant.mediaMetadata.length) {
    throw new Error("SOCIAL_EXECUTION_TRUSTED_MEDIA_REQUIRED");
  }
  const ordered = [...input.variant.mediaMetadata].sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
  const fetchBinary = input.dependency ?? fetchGoogleDriveSelectedFileBinary;
  const resolved: ApprovedMetaMediaDescriptor[] = [];
  try {
    for (const [index, media] of ordered.entries()) {
      const file = files.get(media.assetId);
      if (!file || file.expectedMimeType !== media.mimeType || !media.sha256Checksum
        || file.expectedSha256 !== media.sha256Checksum) throw new Error("SOCIAL_EXECUTION_TRUSTED_MEDIA_REQUIRED");
      const result = await fetchBinary({
        rootFolderIds,
        selectedItemId: media.assetId,
        accessToken: drive.accessToken,
        authorization: drive.authorization,
        nowMs: input.now.getTime(),
        expectedMimeType: file.expectedMimeType,
        expectedByteSize: file.expectedByteSize,
        expectedSha256Checksum: file.expectedSha256,
        signal: AbortSignal.timeout(5 * 60_000),
      });
      if (!result.ready || result.file.id !== media.assetId || result.file.mimeType !== media.mimeType
        || result.file.sha256Checksum !== file.expectedSha256) {
        if (result.ready) await result.file.body.cancel().catch(() => undefined);
        throw new Error("SOCIAL_EXECUTION_TRUSTED_MEDIA_REQUIRED");
      }
      resolved.push({
        source: "ccpun-approved-drive-binary",
        assetId: media.assetId,
        driveFileId: result.file.id,
        approvedRevision: input.variant.revision,
        approvedVersion: input.variant.version,
        fileName: result.file.name,
        byteSize: result.file.byteSize,
        checksumSha256: result.file.sha256Checksum,
        body: result.file.body,
        mimeType: result.file.mimeType,
        order: index + 1,
      });
    }
    return resolved;
  } catch (error) {
    await Promise.allSettled(resolved.map((media) => media.body.cancel()));
    throw error;
  }
}

export async function executeSocialPublication(input: {
  request: z.input<typeof socialPublicationExecuteRequestSchema>;
  actor: string;
  requestId: string;
  env?: Record<string, string | undefined>;
  dependencies?: ExecutionDependencies;
}) {
  const request = socialPublicationExecuteRequestSchema.parse(input.request);
  const env = input.env ?? process.env;
  if (!isSocialProviderExecutionEnabled(env)) throw new Error("SOCIAL_PROVIDER_WRITES_NOT_CONFIGURED");
  const sql = input.dependencies?.sql ?? await verifiedSql(env);
  const row = await loadExecution(sql, request.publicationId);
  if (!row) throw new Error("SOCIAL_EXECUTION_NOT_FOUND");
  const actorRef = safeActorRef(input.actor);
  const deny = async (code: string) => {
    await recordDenied(sql, row.publication_id, actorRef, input.requestId);
    throw new Error(code);
  };

  if (row.job_status === "succeeded" && row.platform_object_id
    && ((row.execution_target === "facebook-publish-now" && row.publication_status === "published")
      || (row.execution_target === "facebook-native-scheduled" && row.publication_status === "native-scheduled"))) {
    return { state: "replay" as const, publicationId: row.publication_id, jobId: row.job_id, platformObjectId: row.platform_object_id };
  }
  if (row.execution_target === "instagram-mobile-handoff") return deny("SOCIAL_EXECUTION_MOBILE_HANDOFF_ONLY");
  if (row.execution_target === "instagram-publish-now") return deny("SOCIAL_EXECUTION_TRUSTED_MEDIA_REQUIRED");
  if (row.channel !== "facebook" || row.job_type !== "publish") {
    return deny("SOCIAL_EXECUTION_UNSUPPORTED_FORMAT");
  }
  if (row.job_version !== request.expectedJobVersion) return deny("SOCIAL_EXECUTION_CAS_CONFLICT");
  if (row.attempt_count >= row.max_attempts) return deny("SOCIAL_EXECUTION_RETRY_EXHAUSTED");
  if (row.job_status === "processing") return deny("SOCIAL_EXECUTION_ACTIVE_LEASE");
  if (row.job_status !== "queued" && !(row.job_status === "failed" && row.last_error_category === "rate-limit")) {
    return deny("SOCIAL_EXECUTION_TERMINAL_JOB");
  }
  if (!["approved", "failed"].includes(row.publication_status)) return deny("SOCIAL_EXECUTION_PUBLICATION_CONFLICT");

  const now = input.dependencies?.now?.() ?? new Date();
  const workerId = `worker:${digest(input.requestId).slice(0, 32)}`;
  const lockExpiresAt = new Date(now.getTime() + 120_000);
  const claimed = await claimExecution(sql, {
    publicationId: row.publication_id,
    jobId: row.job_id,
    expectedVersion: request.expectedJobVersion,
    workerId,
    now: now.toISOString(),
    lockExpiresAt: lockExpiresAt.toISOString(),
    actorRef,
    requestId: input.requestId,
  });
  if (!claimed) throw new Error("SOCIAL_EXECUTION_CAS_CONFLICT");

  let providerCompleted = false;
  let resolvedMedia: ApprovedMetaMediaDescriptor[] = [];
  try {
    const readVariant = input.dependencies?.readVariant ?? (async (variantId: string, currentEnv: Record<string, string | undefined>) => {
      const { listApprovedSocialVariants } = await import("./publishing-store");
      return (await listApprovedSocialVariants(currentEnv)).find((variant) => variant.variantId === variantId) ?? null;
    });
    const variant = await readVariant(row.variant_id, env);
    if (!variant || variant.revision !== row.approved_revision || variant.version !== row.approved_version
      || variant.platform !== row.channel || variant.format !== row.format || variant.publishingMode !== row.publishing_mode) {
      throw new Error("SOCIAL_EXECUTION_EDITORIAL_CONFLICT");
    }
    resolvedMedia = await resolveApprovedDriveMedia({
      request,
      variant,
      env,
      now: input.dependencies?.now?.() ?? new Date(),
      dependency: input.dependencies?.fetchDriveBinary,
    });
    const facebookContent = approvedFacebookContent(variant, resolvedMedia);
    const authorizationNow = input.dependencies?.now?.() ?? new Date();
    const authorization = authorizeSocialProviderExecution({
      providerExecutionEnabled: true,
      executionTarget: row.execution_target,
      approvedByActorType: "human",
      approvalRequestRef: row.approval_request_ref,
      approvedAt: row.approved_at.toISOString(),
      approvedRevision: row.approved_revision,
      approvedVersion: row.approved_version,
      currentRevision: variant.revision,
      currentVersion: variant.version,
      publicationStatus: "approved",
      scheduledAt: row.scheduled_at?.toISOString() ?? null,
      now: authorizationNow.toISOString(),
      job: {
        jobType: "publish",
        status: "processing",
        version: claimed.version,
        expectedVersion: claimed.version,
        attemptCount: claimed.attempt_count,
        maxAttempts: claimed.max_attempts,
        lockOwner: claimed.lock_owner,
        lockExpiresAt: claimed.lock_expires_at.toISOString(),
        idempotencyKey: row.job_idempotency_key,
        expectedIdempotencyKey: `${row.publication_idempotency_key}:job`,
      },
    });
    if (!authorization.providerWriteAllowed) throw new Error("SOCIAL_EXECUTION_AUTHORIZATION_DENIED");

    const providerInput = {
      pageId: env.CCPUN_META_PAGE_ID?.trim() || undefined,
      content: facebookContent,
      now: authorizationNow.toISOString(),
      ...(row.execution_target === "facebook-native-scheduled" ? { scheduledAt: row.scheduled_at!.toISOString() } : {}),
      authorization: { providerWriteAllowed: true as const },
    };
    const providerResult = await publishFacebookPageContent(providerInput, env, input.dependencies?.fetcher ?? fetch);
    providerCompleted = true;
    const scheduled = row.execution_target === "facebook-native-scheduled";
    const finished = await finishExecution(sql, {
      publicationId: row.publication_id,
      jobId: row.job_id,
      claimedVersion: claimed.version,
      workerId,
      platformObjectId: providerResult.platformObjectId,
      status: scheduled ? "native-scheduled" : "published",
      publishedAt: scheduled ? null : (input.dependencies?.now?.() ?? new Date()).toISOString(),
      actorRef,
      requestId: input.requestId,
    });
    if (!finished) throw new Error("SOCIAL_EXECUTION_RECONCILIATION_REQUIRED");
    return {
      state: scheduled ? "scheduled" as const : "published" as const,
      publicationId: row.publication_id,
      jobId: row.job_id,
      platformObjectId: providerResult.platformObjectId,
    };
  } catch (error) {
    await Promise.allSettled(resolvedMedia.map((media) => media.body.cancel()));
    if (providerCompleted) throw new Error("SOCIAL_EXECUTION_RECONCILIATION_REQUIRED");
    const providerMutationMayHaveStarted = error instanceof Error
      && error.message === "META_API_PARTIAL_MUTATION_RECONCILIATION_REQUIRED";
    const mapped = providerMutationMayHaveStarted
      ? { code: "SOCIAL_EXECUTION_RECONCILIATION_REQUIRED", category: "unknown" as const }
      : failure(error);
    const failed = await failExecution(sql, {
      publicationId: row.publication_id,
      jobId: row.job_id,
      claimedVersion: claimed.version,
      workerId,
      category: mapped.category,
      actorRef,
      requestId: input.requestId,
    });
    if (!failed) throw new Error("SOCIAL_EXECUTION_RECONCILIATION_REQUIRED");
    if (providerMutationMayHaveStarted) throw new Error("SOCIAL_EXECUTION_RECONCILIATION_REQUIRED");
    throw new Error(mapped.code);
  }
}
