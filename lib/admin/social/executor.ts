import { z } from "zod";

const boundedId = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_.:-]+$/);

const executorJobSchema = z.object({
  jobId: boundedId,
  version: z.number().int().min(1),
  status: z.enum(["queued", "processing", "failed", "succeeded", "cancelled"]),
  attemptCount: z.number().int().min(0).max(10),
  maxAttempts: z.number().int().min(1).max(10),
  retryable: z.boolean(),
  lockOwner: boundedId.nullable(),
  lockExpiresAt: z.string().datetime().nullable(),
}).superRefine((job, context) => {
  if (job.status === "processing" && (!job.lockOwner || !job.lockExpiresAt)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Processing jobs require a lease" });
  }
  if (job.status !== "processing" && (job.lockOwner || job.lockExpiresAt)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Non-processing jobs cannot retain a lease" });
  }
});

export function planExecutorClaim(input: {
  job: z.input<typeof executorJobSchema>;
  expectedVersion: number;
  workerId: string;
  now: string;
  leaseSeconds: number;
}) {
  const job = executorJobSchema.parse(input.job);
  const expectedVersion = z.number().int().min(1).parse(input.expectedVersion);
  const workerId = boundedId.parse(input.workerId);
  const now = z.string().datetime().parse(input.now);
  const leaseSeconds = z.number().int().min(5).max(300).parse(input.leaseSeconds);
  const result = (state: "claimed" | "cas-conflict" | "active-lease" | "retry-exhausted" | "terminal", reason: string) => ({
    state,
    jobId: job.jobId,
    expectedVersion,
    nextVersion: state === "claimed" ? job.version + 1 : null,
    nextAttemptCount: state === "claimed" ? job.attemptCount + 1 : null,
    lockOwner: state === "claimed" ? workerId : null,
    lockExpiresAt: state === "claimed" ? new Date(Date.parse(now) + leaseSeconds * 1_000).toISOString() : null,
    providerWriteAllowed: false as const,
    reason,
  });

  if (expectedVersion !== job.version) return result("cas-conflict", "Job version changed before claim");
  if (job.status === "succeeded" || job.status === "cancelled") return result("terminal", "Terminal jobs cannot be claimed");
  if (job.status === "processing" && Date.parse(job.lockExpiresAt!) > Date.parse(now)) return result("active-lease", "Another worker still owns the lease");
  if (job.attemptCount >= job.maxAttempts) return result("retry-exhausted", "Maximum attempts reached");
  if (job.status === "failed" && !job.retryable) return result("terminal", "This failure category is not retryable");
  return result("claimed", "CAS and lease checks passed; provider execution remains disabled");
}

const executorCommentSchema = z.object({
  id: boundedId,
  position: z.number().int().min(1).max(20),
  status: z.enum(["approved", "queued", "processing", "published", "failed", "cancelled"]),
  platformCommentId: boundedId.nullable(),
});

export function planOrderedCommentExecution(input: Array<z.input<typeof executorCommentSchema>>) {
  const comments = z.array(executorCommentSchema).min(1).max(20).parse(input).sort((a, b) => a.position - b.position);
  const invalid = (reason: string) => ({ state: "invalid" as const, nextCommentId: null, providerWriteAllowed: false as const, reason });
  if (new Set(comments.map((comment) => comment.id)).size !== comments.length) return invalid("Comment IDs must be unique");
  if (new Set(comments.map((comment) => comment.position)).size !== comments.length) return invalid("Comment positions must be unique");
  if (comments.some((comment, index) => comment.position !== index + 1)) return invalid("Comment positions must be contiguous from one");
  if (comments.some((comment) => comment.status === "published" && !comment.platformCommentId)) return invalid("Published comments require a Platform Comment ID");
  const firstPendingIndex = comments.findIndex((comment) => comment.status !== "published");
  if (firstPendingIndex === -1) return { state: "complete" as const, nextCommentId: null, providerWriteAllowed: false as const, reason: "All comments are published" };
  if (comments.slice(firstPendingIndex + 1).some((comment) => comment.status === "published")) return invalid("Comments cannot publish out of order");
  const next = comments[firstPendingIndex]!;
  if (next.status !== "approved" && next.status !== "failed") {
    return { state: "blocked" as const, nextCommentId: next.id, providerWriteAllowed: false as const, reason: "Next comment is not ready for a first attempt or retry" };
  }
  return { state: "ready" as const, nextCommentId: next.id, providerWriteAllowed: false as const, reason: "Next approved position is eligible; provider execution remains disabled" };
}
