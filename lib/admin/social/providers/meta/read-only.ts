import { z } from "zod";
import { normalizeMetaAnalytics } from "../../provider-adapters";
import { getSocialProviderReadiness } from "../../provider-readonly";
import { META_MINIMUM_READ_SCOPES, normalizeMetaConnection } from "./connection";

if (typeof window !== "undefined") throw new Error("META_READ_SERVER_ONLY");

const responseSchema = z.object({
  data: z.array(z.object({
    id: z.string().trim().min(1).max(120),
    name: z.string().trim().min(1).max(120),
    access_token: z.string().trim().min(1).max(4096).optional(),
    instagram_business_account: z.object({
      id: z.string().trim().min(1).max(120),
      username: z.string().trim().min(1).max(120),
    }).nullable().optional(),
  })).max(20),
});
const summarySchema = z.object({ summary: z.object({ total_count: z.number().int().nonnegative().safe() }) });
const facebookPostsSchema = z.object({ data: z.array(z.object({
  id: z.string().trim().min(1).max(200),
  message: z.string().max(5000).optional().default(""),
  created_time: z.string().datetime({ offset: true }),
  permalink_url: z.string().url().max(1000).optional(),
  shares: z.object({ count: z.number().int().nonnegative().safe() }).optional(),
  comments: summarySchema.optional(),
  reactions: summarySchema.optional(),
})).max(20) });
const instagramMediaSchema = z.object({ data: z.array(z.object({
  id: z.string().trim().min(1).max(200),
  caption: z.string().max(5000).optional().default(""),
  media_type: z.string().trim().min(1).max(40),
  timestamp: z.string().datetime({ offset: true }),
  permalink: z.string().url().max(1000).optional(),
  like_count: z.number().int().nonnegative().safe().optional(),
  comments_count: z.number().int().nonnegative().safe().optional(),
})).max(20) });

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
type Publication = { publicationId: string; platform: string; platformObjectId: string | null };

async function request(url: string, token: string, fetcher: FetchLike) {
  let response: Response;
  try {
    response = await fetcher(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) throw new Error("META_READ_TIMEOUT");
    throw new Error("META_READ_UNAVAILABLE");
  }
  if (response.status === 401 || response.status === 403) throw new Error("META_READ_AUTH_REQUIRED");
  if (response.status === 429) throw new Error("META_READ_RATE_LIMITED");
  if (!response.ok) throw new Error("META_READ_UNAVAILABLE");
  return response.json().catch(() => null) as Promise<unknown>;
}

export async function fetchMetaReadOnlyDiscovery(
  env: Record<string, string | undefined> = process.env,
  fetcher: FetchLike = fetch,
) {
  if (getSocialProviderReadiness("meta", env).status !== "manual-sync-ready") {
    throw new Error("META_READ_NOT_CONFIGURED");
  }
  const token = env.CCPUN_META_ACCESS_TOKEN!.trim();
  const version = env.CCPUN_META_GRAPH_VERSION!.trim();
  const fields = "id,name,access_token,instagram_business_account{id,username}";
  const parsed = responseSchema.safeParse(await request(
    `https://graph.facebook.com/${version}/me/accounts?fields=${encodeURIComponent(fields)}&limit=20`, token, fetcher,
  ));
  if (!parsed.success) throw new Error("META_READ_INVALID_RESPONSE");
  const selectedPageId = env.CCPUN_META_PAGE_ID?.trim() || (parsed.data.data.length === 1 ? parsed.data.data[0]!.id : null);
  const selectedPage = parsed.data.data.find((page) => page.id === selectedPageId);
  const selectedPageToken = selectedPage?.access_token ?? token;
  const [facebookPosts, instagramMedia] = selectedPage ? await Promise.all([
    request(`https://graph.facebook.com/${version}/${encodeURIComponent(selectedPage.id)}/published_posts?fields=${encodeURIComponent("id,message,created_time,permalink_url,shares,comments.limit(0).summary(true),reactions.limit(0).summary(true)")}&limit=20`, selectedPageToken, fetcher),
    selectedPage.instagram_business_account
      ? request(`https://graph.facebook.com/${version}/${encodeURIComponent(selectedPage.instagram_business_account.id)}/media?fields=${encodeURIComponent("id,caption,media_type,timestamp,permalink,like_count,comments_count")}&limit=20`, selectedPageToken, fetcher)
      : Promise.resolve({ data: [] }),
  ]) : [{ data: [] }, { data: [] }];
  const parsedFacebook = facebookPostsSchema.safeParse(facebookPosts);
  const parsedInstagram = instagramMediaSchema.safeParse(instagramMedia);
  if (!parsedFacebook.success || !parsedInstagram.success) throw new Error("META_READ_INVALID_RESPONSE");
  const connection = normalizeMetaConnection({
    mode: "provider-read-only",
    authorizationState: "active",
    grantedScopes: [...META_MINIMUM_READ_SCOPES],
    selectedPageId,
    pages: parsed.data.data.map((page) => ({
      id: page.id,
      name: page.name,
      instagramAccount: page.instagram_business_account
        ? { id: page.instagram_business_account.id, username: page.instagram_business_account.username }
        : null,
    })),
  });
  return {
    ...connection,
    fetchedAt: new Date().toISOString(),
    facebookPosts: parsedFacebook.data.data.map((post) => ({
      id: post.id, text: post.message, publishedAt: post.created_time, permalink: post.permalink_url ?? null,
      metrics: { likes: post.reactions?.summary.total_count, comments: post.comments?.summary.total_count, shares: post.shares?.count },
    })),
    instagramMedia: parsedInstagram.data.data.map((media) => ({
      id: media.id, text: media.caption, mediaType: media.media_type, publishedAt: media.timestamp, permalink: media.permalink ?? null,
      metrics: { likes: media.like_count, comments: media.comments_count },
    })),
  };
}

export function matchMetaHistoricalAnalytics(
  publications: Publication[],
  discovery: Awaited<ReturnType<typeof fetchMetaReadOnlyDiscovery>>,
) {
  const publishedByObjectId = new Map(publications.filter((item) => ["facebook", "instagram"].includes(item.platform) && item.platformObjectId)
    .map((item) => [item.platformObjectId!, item]));
  const providerItems = [
    ...discovery.facebookPosts.map((item) => ({ ...item, platform: "facebook" as const })),
    ...discovery.instagramMedia.map((item) => ({ ...item, platform: "instagram" as const })),
  ];
  const snapshots = providerItems.flatMap((item) => {
    const publication = publishedByObjectId.get(item.id);
    return publication?.platform === item.platform ? [normalizeMetaAnalytics({
      publicationId: publication.publicationId,
      platform: item.platform,
      fetchedAt: discovery.fetchedAt,
      metrics: item.metrics,
    })] : [];
  });
  return {
    snapshots,
    unmatchedProviderObjectIds: providerItems.filter((item) => !publishedByObjectId.has(item.id)).map((item) => item.id),
    persisted: false as const,
  };
}
