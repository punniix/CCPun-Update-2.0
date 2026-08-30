import assert from "node:assert/strict";
import test from "node:test";
import { planExecutorClaim, planOrderedCommentExecution } from "../../lib/admin/social/executor";
import { planApprovedPublication, publicationIdempotencyKey } from "../../lib/admin/social/lifecycle";

const approval = {
  variantId: "variant-facebook-001",
  approvedRevision: "rev-approved-001",
  approvedVersion: 3,
  approvedByActorType: "human" as const,
  currentRevision: "rev-approved-001",
  currentVersion: 3,
  existingPublication: null,
};

test("Human approval creates one revision-bound idempotent operational plan", () => {
  const first = planApprovedPublication(approval);
  const second = planApprovedPublication(approval);
  assert.deepEqual(first, second);
  assert.equal(first.state, "ready");
  assert.equal(first.initialStatus, "approved");
  assert.equal(first.idempotencyKey, publicationIdempotencyKey(approval));
  assert.equal(first.providerWriteAllowed, false);
  assert.equal(planApprovedPublication({ ...approval, currentRevision: "rev-new" }).state, "conflict");
  assert.equal(planApprovedPublication({ ...approval, currentVersion: 4 }).state, "conflict");
  assert.equal(planApprovedPublication({ ...approval, existingPublication: { publicationId: first.publicationId!, idempotencyKey: first.idempotencyKey } }).state, "replay");
  assert.equal(planApprovedPublication({ ...approval, existingPublication: { publicationId: "publication-other", idempotencyKey: "publication:different" } }).state, "conflict");
});

const queuedJob = {
  jobId: "job-social-001",
  version: 7,
  status: "queued" as const,
  attemptCount: 0,
  maxAttempts: 3,
  retryable: true,
  lockOwner: null,
  lockExpiresAt: null,
};

test("Executor claim requires CAS, lease expiry, retry budget and non-terminal state", () => {
  const claim = planExecutorClaim({ job: queuedJob, expectedVersion: 7, workerId: "worker-1", now: "2026-08-29T01:00:00.000Z", leaseSeconds: 30 });
  assert.equal(claim.state, "claimed");
  assert.equal(claim.nextVersion, 8);
  assert.equal(claim.nextAttemptCount, 1);
  assert.equal(claim.providerWriteAllowed, false);
  assert.equal(planExecutorClaim({ job: queuedJob, expectedVersion: 6, workerId: "worker-1", now: "2026-08-29T01:00:00.000Z", leaseSeconds: 30 }).state, "cas-conflict");

  const processing = { ...queuedJob, status: "processing" as const, attemptCount: 1, lockOwner: "worker-other", lockExpiresAt: "2026-08-29T01:01:00.000Z" };
  assert.equal(planExecutorClaim({ job: processing, expectedVersion: 7, workerId: "worker-1", now: "2026-08-29T01:00:00.000Z", leaseSeconds: 30 }).state, "active-lease");
  assert.equal(planExecutorClaim({ job: processing, expectedVersion: 7, workerId: "worker-1", now: "2026-08-29T01:02:00.000Z", leaseSeconds: 30 }).state, "claimed");

  const exhausted = { ...queuedJob, status: "failed" as const, attemptCount: 3 };
  assert.equal(planExecutorClaim({ job: exhausted, expectedVersion: 7, workerId: "worker-1", now: "2026-08-29T01:00:00.000Z", leaseSeconds: 30 }).state, "retry-exhausted");
  assert.equal(planExecutorClaim({ job: { ...exhausted, attemptCount: 1, retryable: false }, expectedVersion: 7, workerId: "worker-1", now: "2026-08-29T01:00:00.000Z", leaseSeconds: 30 }).state, "terminal");
  assert.equal(planExecutorClaim({ job: { ...queuedJob, status: "succeeded" as const }, expectedVersion: 7, workerId: "worker-1", now: "2026-08-29T01:00:00.000Z", leaseSeconds: 30 }).state, "terminal");
});

test("Comment executor allows only the next ordered approved position", () => {
  const comments = [
    { id: "comment-1", position: 1, status: "published" as const, platformCommentId: "provider-comment-1" },
    { id: "comment-2", position: 2, status: "approved" as const, platformCommentId: null },
    { id: "comment-3", position: 3, status: "approved" as const, platformCommentId: null },
  ];
  assert.deepEqual(planOrderedCommentExecution(comments), {
    state: "ready",
    nextCommentId: "comment-2",
    providerWriteAllowed: false,
    reason: "Next approved position is eligible; provider execution remains disabled",
  });
  assert.equal(planOrderedCommentExecution(comments.map((comment, index) => index === 2 ? { ...comment, status: "published", platformCommentId: "provider-comment-3" } : comment)).state, "invalid");
  assert.equal(planOrderedCommentExecution(comments.map((comment, index) => index === 1 ? { ...comment, position: 4 } : comment)).state, "invalid");
  assert.equal(planOrderedCommentExecution(comments.map((comment) => ({ ...comment, status: "published", platformCommentId: `provider-${comment.id}` }))).state, "complete");
});
