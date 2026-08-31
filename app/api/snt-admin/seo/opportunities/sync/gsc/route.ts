import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isConfiguredAdminOrigin, isSameOriginAdminMutation } from "@/lib/admin/auth-config";
import { getAdminIdentity } from "@/lib/admin/identity";
import { hasAdminPermission } from "@/lib/admin/rbac";
import { previousEqualDateRange } from "@/lib/admin/seo-intelligence/contracts";
import { getSeoIntelligenceRuntimeStatus } from "@/lib/admin/seo-intelligence/foundation";
import { getGoogleDataAccessToken } from "@/lib/admin/seo-intelligence/google-data-auth";
import { fetchGscSearchAnalytics } from "@/lib/admin/seo-intelligence/providers/gsc";
import { assembleGscObservations, buildGscObservationContexts } from "@/lib/admin/seo-intelligence/gsc-observations";
import { detectSeoOpportunities } from "@/lib/admin/seo-intelligence/foundation";
import { listPublishedSeoObservationArticles } from "@/lib/admin/sanity-control";

const inputSchema = z.object({
  startDate: z.iso.date(),
  endDate: z.iso.date(),
}).superRefine((input, context) => {
  const start = Date.parse(`${input.startDate}T00:00:00Z`);
  const end = Date.parse(`${input.endDate}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["startDate"], message: "Invalid date range" });
  } else if ((end - start) / 86_400_000 >= 90) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "Date range exceeds 90 days" });
  }
});

let syncInFlight = false;

export async function POST(request: Request) {
  const identity = await getAdminIdentity();
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (identity.actorType !== "human" || !hasAdminPermission(identity.role, "research:provider-query")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (
    !isConfiguredAdminOrigin(request.url, process.env.AUTH_URL) ||
    !isSameOriginAdminMutation(request.url, request.headers.get("origin"))
  ) return NextResponse.json({ error: "forbidden-origin" }, { status: 403 });
  if (!getSeoIntelligenceRuntimeStatus().enabled) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid-input" }, { status: 400 });

  const siteUrl = process.env.CCPUN_GSC_SITE_URL?.trim();
  if (!siteUrl) return NextResponse.json({ error: "provider-not-connected" }, { status: 409 });
  if (syncInFlight) return NextResponse.json({ error: "sync-in-progress" }, { status: 409 });

  syncInFlight = true;
  const requestId = randomUUID();
  const dimensions = ["query", "page", "device", "country"] as const;
  const comparison = previousEqualDateRange(parsed.data.startDate, parsed.data.endDate);
  try {
    // ponytail: one owner and one manual sync at a time; use a durable lock only when scheduled sync exists.
    const token = await getGoogleDataAccessToken();
    const current = await fetchGscSearchAnalytics({ siteUrl, token, ...parsed.data, dimensions });
    const previous = await fetchGscSearchAnalytics({ siteUrl, token, ...comparison, dimensions });
    const editorial = await listPublishedSeoObservationArticles();
    const assembled = assembleGscObservations({
      currentRows: current.rows,
      previousRows: previous.rows,
      contexts: editorial.error ? [] : buildGscObservationContexts(current.rows, editorial.rows),
      fetchedAt: current.fetchedAt,
      comparisonFetchedAt: previous.fetchedAt,
      dateRange: { start: parsed.data.startDate, end: parsed.data.endDate },
      comparisonDateRange: { start: comparison.startDate, end: comparison.endDate },
      currentLimitations: [current.limitation, "Business value uses neutral 3/5 and seasonality remains unknown until editorial governance is explicit."],
      previousLimitations: [previous.limitation],
    });
    const opportunities = detectSeoOpportunities(assembled.observations);
    return NextResponse.json({
      requestId,
      source: "gsc",
      state: "ready",
      dateRange: parsed.data,
      comparisonRange: comparison,
      fetchedAt: current.fetchedAt,
      totalRows: current.rows.length,
      comparisonRows: previous.rows.length,
      observationCount: assembled.observations.length,
      skippedRows: assembled.skipped.length,
      opportunityCount: opportunities.length,
      opportunities: opportunities.slice(0, 100),
      sample: current.rows.slice(0, 100),
      truncated: current.truncated || previous.truncated,
      limitations: [
        current.limitation,
        previous.limitation,
        ...(editorial.error ? ["Sanity editorial context unavailable; no GSC row entered the detector."] : []),
        "Detector accepts only exact governed keyword and canonical URL matches; results are limited to 100 and are not persisted.",
      ],
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "GOOGLE_DATA_NOT_CONFIGURED") return NextResponse.json({ error: "provider-not-connected", requestId }, { status: 409 });
    if (code === "GOOGLE_DATA_AUTH_REQUIRED") return NextResponse.json({ error: "provider-auth-required", requestId }, { status: 401 });
    if (code === "GOOGLE_DATA_RATE_LIMITED") return NextResponse.json({ error: "provider-rate-limited", requestId }, { status: 429, headers: { "Retry-After": "60" } });
    if (code === "GOOGLE_DATA_TIMEOUT") return NextResponse.json({ error: "provider-timeout", requestId }, { status: 504 });
    if (code === "GOOGLE_DATA_INVALID_RESPONSE") return NextResponse.json({ error: "provider-invalid-response", requestId }, { status: 502 });
    if (code === "GSC_AUTH_REQUIRED") return NextResponse.json({ error: "provider-auth-required", requestId }, { status: 401 });
    if (code === "GSC_RATE_LIMITED") return NextResponse.json({ error: "provider-rate-limited", requestId }, { status: 429, headers: { "Retry-After": "60" } });
    if (code === "GSC_TIMEOUT") return NextResponse.json({ error: "provider-timeout", requestId }, { status: 504 });
    if (code === "GSC_INVALID_RESPONSE") return NextResponse.json({ error: "provider-invalid-response", requestId }, { status: 502 });
    return NextResponse.json({ error: "provider-unavailable", requestId }, { status: 502 });
  } finally {
    syncInFlight = false;
  }
}
