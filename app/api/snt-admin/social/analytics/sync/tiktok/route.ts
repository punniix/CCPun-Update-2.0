import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isConfiguredAdminOrigin, isSameOriginAdminMutation } from "@/lib/admin/auth-config";
import { getAdminIdentity } from "@/lib/admin/identity";
import { hasAdminPermission } from "@/lib/admin/rbac";
import {
  getSocialAnalyticsIngestionRuntimeStatus,
  recordTikTokAnalyticsFailure,
  syncTikTokHistoricalAnalytics,
} from "@/lib/admin/social/analytics-ingestion";

let syncInFlight = false;

function providerError(code: string) {
  if (code === "TIKTOK_READ_NOT_CONFIGURED") return { error: "provider-not-connected", status: 409, category: "authentication" as const };
  if (code === "TIKTOK_READ_AUTH_REQUIRED") return { error: "provider-auth-required", status: 401, category: "authentication" as const };
  if (code === "TIKTOK_READ_RATE_LIMITED") return { error: "provider-rate-limited", status: 429, category: "rate-limit" as const };
  if (code === "TIKTOK_READ_TIMEOUT") return { error: "provider-timeout", status: 504, category: "timeout" as const };
  if (code === "TIKTOK_READ_INVALID_RESPONSE") return { error: "provider-invalid-response", status: 502, category: "invalid-response" as const };
  if (code.startsWith("TIKTOK_READ_")) return { error: "provider-unavailable", status: 502, category: "provider-unavailable" as const };
  return null;
}

export async function POST(request: Request) {
  const identity = await getAdminIdentity();
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (identity.actorType !== "human" || !hasAdminPermission(identity.role, "social:read")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!isConfiguredAdminOrigin(request.url, process.env.AUTH_URL)
    || !isSameOriginAdminMutation(request.url, request.headers.get("origin"))) {
    return NextResponse.json({ error: "forbidden-origin" }, { status: 403 });
  }
  if (!getSocialAnalyticsIngestionRuntimeStatus().enabled) return NextResponse.json({ error: "not-found" }, { status: 404 });
  if (syncInFlight) return NextResponse.json({ error: "sync-in-progress" }, { status: 409 });

  syncInFlight = true;
  const requestId = randomUUID();
  try {
    // ponytail: one manual owner sync at a time; add a durable lock only if scheduled sync is approved.
    const result = await syncTikTokHistoricalAnalytics({ actor: identity.actor, requestId });
    return NextResponse.json({ requestId, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const provider = providerError(code);
    if (provider) {
      await recordTikTokAnalyticsFailure({ actor: identity.actor, requestId, category: provider.category }).catch(() => undefined);
      return NextResponse.json({ error: provider.error, requestId }, {
        status: provider.status,
        headers: provider.status === 429 ? { "Retry-After": "60" } : undefined,
      });
    }
    if (code === "SOCIAL_ANALYTICS_NOT_CONFIGURED" || code === "SOCIAL_ANALYTICS_IDENTITY_MISMATCH") {
      return NextResponse.json({ error: "database-not-ready", requestId }, { status: 409 });
    }
    return NextResponse.json({ error: "database-unavailable", requestId }, { status: 503 });
  } finally {
    syncInFlight = false;
  }
}
