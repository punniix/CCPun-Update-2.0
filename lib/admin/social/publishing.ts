import { createHash } from "node:crypto";
import { z } from "zod";
import { mediaIdSchema } from "../media/foundation";
import { WEBSITE_42_SOCIAL_ANALYTICS_BRANCH } from "./provider-readonly";
import { resolveSocialRuntime, SOCIAL_UAT_NEON_IDENTITY } from "./runtime";

const boundedId = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_.:-]+$/);
const revisionSchema = z.string().trim().min(1).max(120);
const executionTargetSchema = z.enum([
  "facebook-publish-now",
  "facebook-native-scheduled",
  "instagram-publish-now",
  "instagram-mobile-handoff",
]);

export const SOCIAL_PUBLICATION_EXECUTION_MIGRATION_VERSION = "20260901_website_42_social_publication_execution_v1";
export const SOCIAL_PUBLICATION_EXECUTION_MIGRATION_CHECKSUM = "sha256:9c9a95c3f29d0c912b6b0c226fea873569809f49ebc8f1a66ab32699bde85bba";
export const SOCIAL_COMMENT_EXECUTION_MIGRATION_VERSION = "20260901_website_42_social_comment_execution_v1";
export const SOCIAL_COMMENT_EXECUTION_MIGRATION_CHECKSUM = "sha256:c9a5512469d8894ccbdebf5c051d7471aef1f9d59973b6a71f5d0f2b7618155d";
export const SOCIAL_PUBLICATION_UAT_NEON = SOCIAL_UAT_NEON_IDENTITY;

export function resolveSocialPublicationRuntime(env: Record<string, string | undefined> = process.env) {
  if (env.CCPUN_SOCIAL_OPERATIONS_ENABLED !== "1") return null;
  return resolveSocialRuntime(env, {
    uatBranches: [WEBSITE_42_SOCIAL_ANALYTICS_BRANCH],
    requireUatNeon: true,
  });
}

export function isSocialPublicationApprovalEnabled(env: Record<string, string | undefined> = process.env) {
  return Boolean(resolveSocialPublicationRuntime(env));
}

export function isSocialProviderExecutionGateEnabled(env: Record<string, string | undefined> = process.env) {
  return env.CCPUN_SOCIAL_PROVIDER_WRITES_ENABLED === "1" && isSocialPublicationApprovalEnabled(env);
}

export function canAdvanceSocialVariantProjection(input: {
  existing: { masterContentId: string; platform: string; revision: string; version: number | null };
  approved: { masterContentId: string; platform: string; revision: string; version: number };
}) {
  if (input.existing.masterContentId !== input.approved.masterContentId || input.existing.platform !== input.approved.platform) return false;
  if (input.existing.version === null || input.approved.version > input.existing.version) return true;
  return input.approved.version === input.existing.version && input.approved.revision === input.existing.revision;
}

export const socialPublicationApprovalSchema = z.strictObject({
  variantId: boundedId,
  masterContentId: boundedId,
  platform: z.enum(["facebook", "instagram"]),
  publishingMode: z.enum(["direct", "native-scheduled", "native-finish"]),
  approvedRevision: revisionSchema,
  approvedVersion: z.number().int().min(1),
  currentRevision: revisionSchema,
  currentVersion: z.number().int().min(1),
  approvedByActorType: z.literal("human"),
  approvalRequestRef: boundedId,
  approvedAt: z.string().datetime(),
  requestedAt: z.string().datetime(),
  scheduledAt: z.string().datetime().nullable(),
  mediaAssetIds: z.array(mediaIdSchema).max(20),
}).superRefine((approval, context) => {
  const scheduled = approval.scheduledAt !== null;
  if (approval.platform === "facebook" && approval.publishingMode === "native-finish") {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["publishingMode"], message: "Facebook native finish is outside this execution contract" });
  }
  if (approval.platform === "instagram" && approval.publishingMode === "native-scheduled") {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["publishingMode"], message: "Instagram native scheduling is not supported" });
  }
  if (approval.publishingMode === "native-scheduled" && (!scheduled || Date.parse(approval.scheduledAt!) <= Date.parse(approval.requestedAt))) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduledAt"], message: "A native scheduled post requires a future schedule" });
  }
  if (approval.publishingMode !== "native-scheduled" && scheduled) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduledAt"], message: "Only native scheduled posts accept a schedule" });
  }
});

function digest(parts: unknown[]) {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}

export function socialPublicationExecutionTarget(input: {
  platform: "facebook" | "instagram";
  publishingMode: "direct" | "native-scheduled" | "native-finish";
}) {
  if (input.platform === "facebook") {
    if (input.publishingMode === "direct") return executionTargetSchema.parse("facebook-publish-now");
    if (input.publishingMode === "native-scheduled") return executionTargetSchema.parse("facebook-native-scheduled");
  }
  if (input.platform === "instagram") {
    if (input.publishingMode === "direct") return executionTargetSchema.parse("instagram-publish-now");
    if (input.publishingMode === "native-finish") return executionTargetSchema.parse("instagram-mobile-handoff");
  }
  throw new Error("UNSUPPORTED_SOCIAL_EXECUTION_TARGET");
}

export function socialExecutionIdempotencyKey(input: {
  variantId: string;
  approvedRevision: string;
  approvedVersion: number;
  executionTarget: z.infer<typeof executionTargetSchema>;
  scheduledAt: string | null;
}) {
  // Schedule is mutable while approval is inactive; one approved editorial snapshot must retain one execution identity.
  return `social-execution:${digest([
    input.variantId,
    input.approvedRevision,
    input.approvedVersion,
    input.executionTarget,
  ])}`;
}

export function planSocialPublicationApproval(input: z.input<typeof socialPublicationApprovalSchema>) {
  const approval = socialPublicationApprovalSchema.parse(input);
  const executionTarget = socialPublicationExecutionTarget(approval);
  const idempotencyKey = socialExecutionIdempotencyKey({ ...approval, executionTarget });
  const conflict = approval.approvedRevision !== approval.currentRevision
    || approval.approvedVersion !== approval.currentVersion;
  const handoff = executionTarget === "instagram-mobile-handoff";

  return {
    state: conflict ? "conflict" as const : "ready" as const,
    executionTarget,
    publicationStatus: conflict ? null : handoff ? "awaiting-native-finish" as const : "approved" as const,
    jobType: conflict ? null : handoff ? "native-handoff" as const : "publish" as const,
    idempotencyKey,
    approvedRevision: approval.approvedRevision,
    approvedVersion: approval.approvedVersion,
    mediaAssetIds: approval.mediaAssetIds,
    providerWriteAllowed: false as const,
    reason: conflict
      ? "Current Sanity revision or version differs from the human-approved snapshot"
      : handoff
        ? "Prepare a mobile handoff only; Instagram native drafts are not created by the provider"
        : "Record the approval and queue one revision-bound job; provider execution requires a separate guarded claim",
  };
}

const providerExecutionAuthorizationSchema = z.strictObject({
  providerExecutionEnabled: z.boolean(),
  executionTarget: executionTargetSchema,
  approvedByActorType: z.literal("human"),
  approvalRequestRef: boundedId,
  approvedAt: z.string().datetime(),
  approvedRevision: revisionSchema,
  approvedVersion: z.number().int().min(1),
  currentRevision: revisionSchema,
  currentVersion: z.number().int().min(1),
  publicationStatus: z.literal("approved"),
  scheduledAt: z.string().datetime().nullable(),
  now: z.string().datetime(),
  job: z.strictObject({
    jobType: z.literal("publish"),
    status: z.literal("processing"),
    version: z.number().int().min(2),
    expectedVersion: z.number().int().min(2),
    attemptCount: z.number().int().min(1).max(10),
    maxAttempts: z.number().int().min(1).max(10),
    lockOwner: boundedId,
    lockExpiresAt: z.string().datetime(),
    idempotencyKey: z.string().trim().min(16).max(200),
    expectedIdempotencyKey: z.string().trim().min(16).max(200),
  }),
});

export function authorizeSocialProviderExecution(input: z.input<typeof providerExecutionAuthorizationSchema>) {
  const execution = providerExecutionAuthorizationSchema.parse(input);
  const deny = (reason: string) => ({ providerWriteAllowed: false as const, reason });
  if (!execution.providerExecutionEnabled) return deny("Provider execution is disabled for this runtime");
  if (execution.executionTarget === "instagram-mobile-handoff") {
    return deny("Instagram mobile handoff never authorizes a provider write");
  }
  if (execution.approvedRevision !== execution.currentRevision || execution.approvedVersion !== execution.currentVersion) {
    return deny("Editorial content changed after human approval");
  }
  if (execution.job.version !== execution.job.expectedVersion) return deny("Executor job version changed after claim");
  if (execution.job.idempotencyKey !== execution.job.expectedIdempotencyKey) return deny("Executor idempotency key does not match the approved publication");
  if (execution.job.attemptCount > execution.job.maxAttempts) return deny("Executor retry budget is exhausted");
  if (Date.parse(execution.job.lockExpiresAt) <= Date.parse(execution.now)) return deny("Executor lease expired before provider execution");
  if (execution.executionTarget === "facebook-native-scheduled") {
    if (!execution.scheduledAt || Date.parse(execution.scheduledAt) <= Date.parse(execution.now)) return deny("Facebook native schedule must still be in the future");
  } else if (execution.scheduledAt !== null) {
    return deny("Publish-now execution cannot carry a schedule");
  }
  return {
    providerWriteAllowed: true as const,
    reason: "Human approval, editorial revision, idempotency, CAS version and active lease all match",
  };
}
