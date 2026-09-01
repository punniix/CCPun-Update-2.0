import { z } from "zod";
import { normalizeYouTubeAnalytics } from "../../provider-adapters";
import { getSocialProviderReadiness, SOCIAL_READ_ONLY_SCOPES } from "../../provider-readonly";

if (typeof window !== "undefined") throw new Error("YOUTUBE_READ_SERVER_ONLY");

const id = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_-]+$/);
const count = z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().nonnegative().safe());
const channelsSchema = z.object({ items: z.array(z.object({
  id,
  snippet: z.object({ title: z.string().trim().min(1).max(200) }),
  contentDetails: z.object({ relatedPlaylists: z.object({ uploads: id }) }),
  statistics: z.object({ viewCount: count, subscriberCount: count.optional(), videoCount: count }),
})).min(1).max(1) });
const playlistSchema = z.object({ items: z.array(z.object({ contentDetails: z.object({ videoId: id }) })).max(20) });
const videosSchema = z.object({ items: z.array(z.object({
  id,
  snippet: z.object({ title: z.string().trim().min(1).max(200), publishedAt: z.string().datetime() }),
  statistics: z.object({ viewCount: count.optional(), likeCount: count.optional(), commentCount: count.optional() }),
})).max(20) });

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
type Publication = { publicationId: string; platform: string; platformObjectId: string | null };

async function request(url: string, token: string, fetcher: FetchLike) {
  let response: Response;
  try {
    response = await fetcher(url, { method: "GET", headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
  } catch (error) {
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) throw new Error("YOUTUBE_READ_TIMEOUT");
    throw new Error("YOUTUBE_READ_UNAVAILABLE");
  }
  if (response.status === 401 || response.status === 403) throw new Error("YOUTUBE_READ_AUTH_REQUIRED");
  if (response.status === 429) throw new Error("YOUTUBE_READ_RATE_LIMITED");
  if (!response.ok) throw new Error("YOUTUBE_READ_UNAVAILABLE");
  return response.json().catch(() => null) as Promise<unknown>;
}

export async function fetchYouTubeReadOnlyDiscovery(
  env: Record<string, string | undefined> = process.env,
  fetcher: FetchLike = fetch,
) {
  if (getSocialProviderReadiness("youtube", env).status !== "manual-sync-ready") throw new Error("YOUTUBE_READ_NOT_CONFIGURED");
  const token = env.CCPUN_YOUTUBE_ACCESS_TOKEN!.trim();
  const channels = channelsSchema.safeParse(await request("https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true", token, fetcher));
  if (!channels.success) throw new Error("YOUTUBE_READ_INVALID_RESPONSE");
  const channel = channels.data.items[0]!;
  const playlist = playlistSchema.safeParse(await request(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${encodeURIComponent(channel.contentDetails.relatedPlaylists.uploads)}&maxResults=20`, token, fetcher));
  if (!playlist.success) throw new Error("YOUTUBE_READ_INVALID_RESPONSE");
  const videoIds = playlist.data.items.map((item) => item.contentDetails.videoId);
  const videos = videosSchema.safeParse(videoIds.length === 0
    ? { items: [] }
    : await request(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${encodeURIComponent(videoIds.join(","))}&maxResults=20`, token, fetcher));
  if (!videos.success) throw new Error("YOUTUBE_READ_INVALID_RESPONSE");
  return {
    mode: "provider-read-only" as const,
    status: "connected" as const,
    grantedScopes: [...SOCIAL_READ_ONLY_SCOPES.youtube],
    channel: { id: channel.id, title: channel.snippet.title, metrics: channel.statistics },
    videos: videos.data.items.map((video) => ({
      id: video.id, title: video.snippet.title, publishedAt: video.snippet.publishedAt,
      metrics: { views: video.statistics.viewCount, likes: video.statistics.likeCount, comments: video.statistics.commentCount },
    })),
    fetchedAt: new Date().toISOString(),
    providerRequestAllowed: true as const,
    providerWriteAllowed: false as const,
    backgroundSyncAllowed: false as const,
    limitations: ["อ่าน Channel และวิดีโอล่าสุดไม่เกิน 20 รายการ", "Watch time และ retention ต้องเพิ่ม YouTube Analytics scope ภายหลัง"],
  };
}

export function matchYouTubeHistoricalAnalytics(
  publications: Publication[],
  discovery: Awaited<ReturnType<typeof fetchYouTubeReadOnlyDiscovery>>,
) {
  const publishedByObjectId = new Map(publications.filter((item) => item.platform === "youtube" && item.platformObjectId)
    .map((item) => [item.platformObjectId!, item.publicationId]));
  const snapshots = discovery.videos.flatMap((video) => {
    const publicationId = publishedByObjectId.get(video.id);
    return publicationId ? [normalizeYouTubeAnalytics({ publicationId, fetchedAt: discovery.fetchedAt, metrics: video.metrics })] : [];
  });
  return { snapshots, unmatchedProviderObjectIds: discovery.videos.filter((video) => !publishedByObjectId.has(video.id)).map((video) => video.id), persisted: false as const };
}
