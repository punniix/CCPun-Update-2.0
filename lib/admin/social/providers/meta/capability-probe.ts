import "server-only";

import { z } from "zod";
import { getSocialProviderReadiness } from "../../provider-readonly";

if (typeof window !== "undefined") throw new Error("META_CAPABILITY_PROBE_SERVER_ONLY");

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type ProbeState =
  | "available"
  | "empty"
  | "permission_denied"
  | "unsupported_or_invalid"
  | "rate_limited"
  | "provider_error";

const pageListSchema = z.object({
  data: z.array(z.object({
    id: z.string().trim().min(1).max(120),
    access_token: z.string().trim().min(1).max(4096).nullable().optional(),
    instagram_business_account: z.object({ id: z.string().trim().min(1).max(120) }).nullable().optional(),
  })).max(100),
});

const postListSchema = z.object({
  data: z.array(z.object({
    id: z.string().trim().min(1).max(200),
    status_type: z.string().trim().min(1).max(80).nullable().optional(),
  })).max(25),
});

const mediaListSchema = z.object({
  data: z.array(z.object({
    id: z.string().trim().min(1).max(200),
    media_type: z.string().trim().min(1).max(40),
    media_product_type: z.string().trim().min(1).max(40).nullable().optional(),
  })).max(25),
});

const permissionListSchema = z.object({
  data: z.array(z.object({
    permission: z.string().trim().min(1).max(120),
    status: z.string().trim().min(1).max(40),
  })).max(200),
});

function classifyGraphFailure(status: number, body: unknown): ProbeState {
  const parsed = z.object({ error: z.object({ code: z.number().optional() }).optional() }).safeParse(body);
  const code = parsed.success ? parsed.data.error?.code : undefined;
  if (status === 401 || status === 403 || code === 10 || code === 190 || code === 200) return "permission_denied";
  if (status === 429 || code === 4 || code === 17 || code === 32 || code === 613) return "rate_limited";
  if (code === 100) return "unsupported_or_invalid";
  return "provider_error";
}

async function graphRequest(
  version: string,
  path: string,
  token: string,
  params: Record<string, string | number> = {},
  fetcher: FetchLike,
) {
  const url = new URL(`https://graph.facebook.com/${version}/${path.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  let response: Response;
  try {
    response = await fetcher(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) throw new Error("META_CAPABILITY_TIMEOUT");
    throw new Error("META_CAPABILITY_UNAVAILABLE");
  }
  const body = await response.json().catch(() => null) as unknown;
  return { ok: response.ok, status: response.status, body };
}

async function probeInsightMetric(
  version: string,
  objectId: string,
  metric: string,
  token: string,
  fetcher: FetchLike,
) {
  const response = await graphRequest(version, `${encodeURIComponent(objectId)}/insights`, token, { metric }, fetcher);
  if (!response.ok) return { metric, state: classifyGraphFailure(response.status, response.body) as ProbeState };
  const parsed = z.object({ data: z.array(z.object({ name: z.string().optional() }).passthrough()).max(20) }).safeParse(response.body);
  if (!parsed.success) return { metric, state: "provider_error" as const };
  return { metric, state: parsed.data.data.length > 0 ? "available" as const : "empty" as const };
}

function hasAttestedScope(env: Record<string, string | undefined>, scope: string) {
  return (env.CCPUN_META_GRANTED_SCOPES ?? "").split(",").map((value) => value.trim()).filter(Boolean).includes(scope);
}

export async function probeMetaInsightsCapabilities(
  env: Record<string, string | undefined> = process.env,
  fetcher: FetchLike = fetch,
) {
  if (getSocialProviderReadiness("meta", env).status !== "manual-sync-ready") throw new Error("META_CAPABILITY_NOT_CONFIGURED");
  const token = env.CCPUN_META_ACCESS_TOKEN!.trim();
  const version = env.CCPUN_META_GRAPH_VERSION!.trim();

  const pagesResponse = await graphRequest(
    version,
    "me/accounts",
    token,
    { fields: "id,access_token,instagram_business_account{id}", limit: 20 },
    fetcher,
  );
  if (!pagesResponse.ok) {
    if (classifyGraphFailure(pagesResponse.status, pagesResponse.body) === "permission_denied") throw new Error("META_CAPABILITY_AUTH_REQUIRED");
    throw new Error("META_CAPABILITY_UNAVAILABLE");
  }
  const pages = pageListSchema.safeParse(pagesResponse.body);
  if (!pages.success) throw new Error("META_CAPABILITY_INVALID_RESPONSE");
  const selectedPageId = env.CCPUN_META_PAGE_ID?.trim() || (pages.data.data.length === 1 ? pages.data.data[0]!.id : null);
  const selectedPage = pages.data.data.find((page) => page.id === selectedPageId);
  if (!selectedPage) throw new Error("META_CAPABILITY_PAGE_SELECTION_REQUIRED");
  const pageToken = selectedPage.access_token ?? token;

  const livePermissionsResponse = await graphRequest(version, "me/permissions", token, {}, fetcher);
  let livePermissions: { state: ProbeState; readInsights: boolean | null; instagramManageInsights: boolean | null };
  if (!livePermissionsResponse.ok) {
    livePermissions = {
      state: classifyGraphFailure(livePermissionsResponse.status, livePermissionsResponse.body),
      readInsights: null,
      instagramManageInsights: null,
    };
  } else {
    const parsed = permissionListSchema.safeParse(livePermissionsResponse.body);
    if (!parsed.success) {
      livePermissions = { state: "provider_error", readInsights: null, instagramManageInsights: null };
    } else {
      const granted = new Set(parsed.data.data.filter((item) => item.status === "granted").map((item) => item.permission));
      livePermissions = {
        state: "available",
        readInsights: granted.has("read_insights"),
        instagramManageInsights: granted.has("instagram_manage_insights"),
      };
    }
  }

  const pageMetrics = ["page_media_view", "page_views_total"];
  const facebookPostMetrics = ["post_media_view", "post_clicks", "post_reactions_by_type_total", "post_video_view_time"];
  const instagramMetrics = ["views", "reach", "saved", "shares", "total_interactions"];
  const instagramVideoMetrics = ["ig_reels_video_view_total_time", "ig_reels_avg_watch_time", "plays"];

  const pageInsights = [];
  for (const metric of pageMetrics) pageInsights.push(await probeInsightMetric(version, selectedPage.id, metric, pageToken, fetcher));

  const postsResponse = await graphRequest(version, `${encodeURIComponent(selectedPage.id)}/published_posts`, pageToken, { fields: "id,status_type", limit: 25 }, fetcher);
  const posts = postsResponse.ok ? postListSchema.safeParse(postsResponse.body) : null;
  const samplePost = posts?.success ? posts.data.data[0] ?? null : null;
  const sampleVideoPost = posts?.success ? posts.data.data.find((post) => post.status_type === "added_video") ?? null : null;
  const facebookPostInsights = [];
  if (samplePost) {
    for (const metric of facebookPostMetrics) facebookPostInsights.push(await probeInsightMetric(version, samplePost.id, metric, pageToken, fetcher));
  }

  const instagramId = selectedPage.instagram_business_account?.id ?? null;
  const instagramInsights: Array<{ metric: string; state: ProbeState }> = [];
  const instagramVideoInsights: Array<{ metric: string; state: ProbeState }> = [];
  let instagramSampleType: string | null = null;
  let instagramVideoSampleAvailable = false;
  if (instagramId) {
    const mediaResponse = await graphRequest(version, `${encodeURIComponent(instagramId)}/media`, pageToken, { fields: "id,media_type,media_product_type", limit: 25 }, fetcher);
    const media = mediaResponse.ok ? mediaListSchema.safeParse(mediaResponse.body) : null;
    const sample = media?.success ? media.data.data[0] ?? null : null;
    const video = media?.success ? media.data.data.find((item) => item.media_type === "VIDEO") ?? null : null;
    instagramSampleType = sample?.media_type ?? null;
    instagramVideoSampleAvailable = Boolean(video);
    if (sample) for (const metric of instagramMetrics) instagramInsights.push(await probeInsightMetric(version, sample.id, metric, pageToken, fetcher));
    if (video) for (const metric of instagramVideoMetrics) instagramVideoInsights.push(await probeInsightMetric(version, video.id, metric, pageToken, fetcher));
  }

  return {
    mode: "provider-read-only-capability-probe" as const,
    providerWriteAllowed: false as const,
    persisted: false as const,
    configuredScopeAttestation: {
      readInsights: hasAttestedScope(env, "read_insights"),
      instagramManageInsights: hasAttestedScope(env, "instagram_manage_insights"),
    },
    livePermissions,
    facebook: {
      pageInsights,
      postSampleAvailable: Boolean(samplePost),
      videoPostSampleAvailable: Boolean(sampleVideoPost),
      postInsights: facebookPostInsights,
    },
    instagram: {
      linked: Boolean(instagramId),
      sampleType: instagramSampleType,
      videoSampleAvailable: instagramVideoSampleAvailable,
      insights: instagramInsights,
      videoInsights: instagramVideoInsights,
    },
  };
}
