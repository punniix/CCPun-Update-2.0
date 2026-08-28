import { createHash } from "node:crypto";

export const MEDIA_UPLOAD_INTENT_RATE_WINDOW_MS = 60_000;
export const MEDIA_UPLOAD_INTENT_RATE_LIMIT = 6;

export function hashMediaUploadRateLimitActor(actor: string): string {
  return createHash("sha256")
    .update(`ccpun-media-upload-intent:${actor.trim().toLowerCase()}`)
    .digest("hex");
}

export function createProcessLocalMediaUploadRateLimiter(options: {
  limit?: number;
  windowMs?: number;
} = {}) {
  const limit = options.limit ?? MEDIA_UPLOAD_INTENT_RATE_LIMIT;
  const windowMs = options.windowMs ?? MEDIA_UPLOAD_INTENT_RATE_WINDOW_MS;
  const recentRequestsByActorHash = new Map<string, number[]>();

  return {
    reserve(actor: string, now = Date.now()):
      | { allowed: true; retryAfterSeconds: 0 }
      | { allowed: false; retryAfterSeconds: number } {
      const actorHash = hashMediaUploadRateLimitActor(actor);
      const cutoff = now - windowMs;
      const recentRequests = (recentRequestsByActorHash.get(actorHash) ?? []).filter((requestedAt) => requestedAt > cutoff);

      if (recentRequests.length >= limit) {
        recentRequestsByActorHash.set(actorHash, recentRequests);
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((recentRequests[0] + windowMs - now) / 1_000)),
        };
      }

      recentRequests.push(now);
      recentRequestsByActorHash.set(actorHash, recentRequests);
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}
