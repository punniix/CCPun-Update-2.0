import { z } from "zod";
import { getSocialProviderReadiness } from "../../provider-readonly";
import { META_MINIMUM_READ_SCOPES, normalizeMetaConnection } from "./connection";

if (typeof window !== "undefined") throw new Error("META_READ_SERVER_ONLY");

const responseSchema = z.object({
  data: z.array(z.object({
    id: z.string().trim().min(1).max(120),
    name: z.string().trim().min(1).max(120),
    instagram_business_account: z.object({
      id: z.string().trim().min(1).max(120),
      username: z.string().trim().min(1).max(120),
    }).nullable().optional(),
  })).max(25),
});

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export async function fetchMetaReadOnlyDiscovery(
  env: Record<string, string | undefined> = process.env,
  fetcher: FetchLike = fetch,
) {
  if (getSocialProviderReadiness("meta", env).status !== "manual-sync-ready") {
    throw new Error("META_READ_NOT_CONFIGURED");
  }
  const token = env.CCPUN_META_ACCESS_TOKEN!.trim();
  const version = env.CCPUN_META_GRAPH_VERSION!.trim();
  const fields = "id,name,instagram_business_account{id,username}";
  let response: Response;
  try {
    response = await fetcher(`https://graph.facebook.com/${version}/me/accounts?fields=${encodeURIComponent(fields)}&limit=25`, {
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
  const parsed = responseSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new Error("META_READ_INVALID_RESPONSE");

  return normalizeMetaConnection({
    mode: "provider-read-only",
    authorizationState: "active",
    grantedScopes: [...META_MINIMUM_READ_SCOPES],
    selectedPageId: null,
    pages: parsed.data.data.map((page) => ({
      id: page.id,
      name: page.name,
      instagramAccount: page.instagram_business_account
        ? { id: page.instagram_business_account.id, username: page.instagram_business_account.username }
        : null,
    })),
  });
}
