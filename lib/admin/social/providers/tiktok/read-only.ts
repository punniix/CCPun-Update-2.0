import { z } from "zod";
import { normalizeTikTokAnalytics } from "../../provider-adapters";
import { getSocialProviderReadiness, SOCIAL_READ_ONLY_SCOPES } from "../../provider-readonly";

if (typeof window !== "undefined") throw new Error("TIKTOK_READ_SERVER_ONLY");

const boundedId = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_.:-]+$/);
const count = z.number().int().nonnegative().safe();
const epochSeconds = z.number().int().min(0).max(4_102_444_800);
const cursorMilliseconds = z.number().int().min(0).max(4_102_444_800_000);
const userResponseSchema = z.object({
  data: z.object({ user: z.object({
    open_id: boundedId,
    display_name: z.string().trim().min(1).max(120),
  }) }),
  error: z.object({ code: z.literal("ok") }),
});
const videoResponseSchema = z.object({
  data: z.object({
    videos: z.array(z.object({
      id: boundedId,
      title: z.string().max(150).optional().default(""),
      create_time: epochSeconds,
      view_count: count.optional(),
      like_count: count.optional(),
      comment_count: count.optional(),
      share_count: count.optional(),
    })).max(20),
    cursor: cursorMilliseconds.optional().default(0),
    has_more: z.boolean(),
  }),
  error: z.object({ code: z.literal("ok") }),
});

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
type Publication = { publicationId: string; platform: string; platformObjectId: string | null };

async function request(url: string, token: string, init: RequestInit, fetcher: FetchLike) {
  let response: Response;
  try {
    response = await fetcher(url, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) throw new Error("TIKTOK_READ_TIMEOUT");
    throw new Error("TIKTOK_READ_UNAVAILABLE");
  }
  if (response.status === 401 || response.status === 403) throw new Error("TIKTOK_READ_AUTH_REQUIRED");
  if (response.status === 429) throw new Error("TIKTOK_READ_RATE_LIMITED");
  if (!response.ok) throw new Error("TIKTOK_READ_UNAVAILABLE");
  return response.json().catch(() => null) as Promise<unknown>;
}

export async function fetchTikTokReadOnlyDiscovery(
  env: Record<string, string | undefined> = process.env,
  fetcher: FetchLike = fetch,
) {
  if (getSocialProviderReadiness("tiktok", env).status !== "manual-sync-ready") {
    throw new Error("TIKTOK_READ_NOT_CONFIGURED");
  }
  const token = env.CCPUN_TIKTOK_ACCESS_TOKEN!.trim();
  const user = userResponseSchema.safeParse(await request(
    "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name",
    token,
    { method: "GET" },
    fetcher,
  ));
  const videos = videoResponseSchema.safeParse(await request(
    "https://open.tiktokapis.com/v2/video/list/?fields=id,title,create_time,view_count,like_count,comment_count,share_count",
    token,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ max_count: 20 }) },
    fetcher,
  ));
  if (!user.success || !videos.success) throw new Error("TIKTOK_READ_INVALID_RESPONSE");
  const fetchedAt = new Date().toISOString();
  return {
    mode: "provider-read-only" as const,
    status: "connected" as const,
    grantedScopes: [...SOCIAL_READ_ONLY_SCOPES.tiktok],
    profile: { openId: user.data.data.user.open_id, displayName: user.data.data.user.display_name },
    videos: videos.data.data.videos.map((video) => ({
      id: video.id,
      title: video.title,
      publishedAt: new Date(video.create_time * 1_000).toISOString(),
      metrics: {
        viewCount: video.view_count,
        likeCount: video.like_count,
        commentCount: video.comment_count,
        shareCount: video.share_count,
      },
    })),
    nextCursor: videos.data.data.has_more ? videos.data.data.cursor : null,
    fetchedAt,
    providerRequestAllowed: true as const,
    providerWriteAllowed: false as const,
    backgroundSyncAllowed: false as const,
    limitations: ["แสดงวิดีโอล่าสุดไม่เกิน 20 รายการต่อการกด Sync", "ไม่บันทึก token, cursor หรือ metrics ลงฐานข้อมูล"],
  };
}

export function matchTikTokHistoricalAnalytics(
  publications: Publication[],
  discovery: Awaited<ReturnType<typeof fetchTikTokReadOnlyDiscovery>>,
) {
  const publishedByObjectId = new Map(
    publications.filter((item) => item.platform === "tiktok" && item.platformObjectId)
      .map((item) => [item.platformObjectId!, item.publicationId]),
  );
  const snapshots = discovery.videos.flatMap((video) => {
    const publicationId = publishedByObjectId.get(video.id);
    return publicationId ? [normalizeTikTokAnalytics({
      publicationId,
      fetchedAt: discovery.fetchedAt,
      metrics: video.metrics,
    })] : [];
  });
  return {
    snapshots,
    unmatchedProviderObjectIds: discovery.videos.filter((video) => !publishedByObjectId.has(video.id)).map((video) => video.id),
    persisted: false as const,
  };
}
