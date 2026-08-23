import "server-only";

import { randomBytes } from "node:crypto";
import { lookup } from "node:dns/promises";
import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  Client,
  StreamableHTTPClientTransport,
  UnauthorizedError,
  type FetchLike,
  type OAuthClientInformationContext,
  type OAuthClientMetadata,
  type OAuthClientProvider,
  type OAuthDiscoveryState,
  type StoredOAuthClientInformation,
  type StoredOAuthTokens,
} from "@modelcontextprotocol/client";
import { z } from "zod";
import { getLocalAdminOrigin, isSafeExternalAuthorizationUrl } from "./auth-config";
import { getAdminEnvironment } from "./environment";
import { isPublicInternetAddress } from "./provider-network";
import { researchInputSchema, type ResearchInput } from "./research-input";

const SERVER_URL = new URL("https://ubersuggest-mcp.neilpatelapi.com/mcp");
const PROVIDER_ORIGIN = SERVER_URL.origin;
const CALLBACK_PATH = "/api/snt-admin/providers/ubersuggest/callback";
const STORE_DIR = path.join(process.cwd(), ".ccpun-local");
const STORE_PATH = path.join(STORE_DIR, "ubersuggest-oauth.json");
const STORE_TMP_PATH = `${STORE_PATH}.tmp`;
const AUTH_MAX_AGE_MS = 10 * 60 * 1000;
const PROVIDER_MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const KEYWORD_TOOL_TIMEOUT_MS = 45_000;

type Store = {
  clientByIssuer?: Record<string, StoredOAuthClientInformation>;
  tokensByIssuer?: Record<string, StoredOAuthTokens>;
  lastIssuer?: string;
  codeVerifier?: string;
  discoveryState?: OAuthDiscoveryState;
  pending?: { state: string; createdAt: string };
};

const overviewSchema = z.object({
  search_volume: z.number().min(0).nullish(),
  seo_difficulty: z.number().min(0).max(100).nullish(),
  search_intent: z.string().trim().max(80).nullish(),
  language: z.string().trim().max(80).nullish(),
  location: z.string().trim().max(120).nullish(),
}).passthrough();

const serpSchema = z.object({
  updated_at: z.string().max(40).optional(),
  serpEntries: z.array(z.object({
    position: z.number().int().positive().nullish(),
    title: z.string().trim().max(500).nullish(),
    url: z.string().url().nullish(),
    domain: z.string().trim().max(255).nullish(),
    type: z.string().trim().max(80).nullish(),
  }).passthrough()).max(100).default([]),
}).passthrough();

function providerLaneAllowed() {
  return ["development", "local-uat", "local-production"].includes(getAdminEnvironment());
}

function callbackUrl() {
  const environment = getAdminEnvironment();
  const origin = getLocalAdminOrigin(environment) ?? (environment === "development" ? "http://localhost:3000" : null);
  if (!origin || process.env.AUTH_URL?.trim() !== origin) throw new Error("UBERSUGGEST_CALLBACK_ORIGIN_INVALID");
  return `${origin}${CALLBACK_PATH}`;
}

function assertPinnedProviderUrl(value: string | undefined) {
  if (!value || !isSafeExternalAuthorizationUrl(new URL(value), PROVIDER_ORIGIN)) {
    throw new Error("UBERSUGGEST_OAUTH_ORIGIN_INVALID");
  }
}

function assertPinnedDiscoveryState(value: OAuthDiscoveryState) {
  assertPinnedProviderUrl(value.authorizationServerUrl);
  const metadata = value.authorizationServerMetadata;
  for (const endpoint of [metadata?.issuer, metadata?.authorization_endpoint, metadata?.token_endpoint, metadata?.registration_endpoint]) {
    if (endpoint) assertPinnedProviderUrl(endpoint);
  }
  for (const issuer of value.resourceMetadata?.authorization_servers ?? []) assertPinnedProviderUrl(issuer);
}

const providerFetch: FetchLike = async (input, init) => {
  const url = new URL(input);
  if (!isSafeExternalAuthorizationUrl(url, PROVIDER_ORIGIN)) throw new Error("UBERSUGGEST_PROVIDER_URL_REJECTED");
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicInternetAddress(address))) {
    throw new Error("UBERSUGGEST_PROVIDER_ADDRESS_REJECTED");
  }
  const response = await fetch(url, { ...init, redirect: "manual" });
  if (response.status >= 300 && response.status < 400) throw new Error("UBERSUGGEST_PROVIDER_REDIRECT_REJECTED");
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > PROVIDER_MAX_RESPONSE_BYTES) {
    throw new Error("UBERSUGGEST_PROVIDER_RESPONSE_TOO_LARGE");
  }
  return response;
};

async function loadStore(): Promise<Store> {
  try {
    const parsed = JSON.parse(await readFile(STORE_PATH, "utf8"));
    return parsed && typeof parsed === "object" ? parsed as Store : {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw new Error("UBERSUGGEST_CREDENTIAL_STORE_INVALID");
  }
}

async function saveStore(store: Store) {
  await mkdir(STORE_DIR, { recursive: true, mode: 0o700 });
  await chmod(STORE_DIR, 0o700);
  await writeFile(STORE_TMP_PATH, `${JSON.stringify(store)}\n`, { mode: 0o600 });
  await rename(STORE_TMP_PATH, STORE_PATH);
  await chmod(STORE_PATH, 0o600);
}

class LocalOAuthProvider implements OAuthClientProvider {
  authorizationUrl?: URL;

  get redirectUrl() { return callbackUrl(); }
  get clientMetadata(): OAuthClientMetadata {
    const redirectUrl = callbackUrl();
    return {
      client_name: "CCPun Control Plane (Local)",
      redirect_uris: [redirectUrl],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    };
  }

  async state() { return (await loadStore()).pending?.state ?? ""; }
  async clientInformation(ctx?: OAuthClientInformationContext) {
    const store = await loadStore();
    return store.clientByIssuer?.[ctx?.issuer ?? store.lastIssuer ?? ""];
  }
  async saveClientInformation(value: StoredOAuthClientInformation, ctx?: OAuthClientInformationContext) {
    const store = await loadStore();
    const issuer = ctx?.issuer ?? value.issuer;
    if (!issuer) throw new Error("UBERSUGGEST_ISSUER_REQUIRED");
    store.clientByIssuer = { ...store.clientByIssuer, [issuer]: value };
    store.lastIssuer = issuer;
    await saveStore(store);
  }
  async tokens(ctx?: OAuthClientInformationContext) {
    const store = await loadStore();
    return store.tokensByIssuer?.[ctx?.issuer ?? store.lastIssuer ?? ""];
  }
  async saveTokens(value: StoredOAuthTokens, ctx?: OAuthClientInformationContext) {
    const store = await loadStore();
    const issuer = ctx?.issuer ?? value.issuer;
    if (!issuer) throw new Error("UBERSUGGEST_ISSUER_REQUIRED");
    store.tokensByIssuer = { ...store.tokensByIssuer, [issuer]: value };
    store.lastIssuer = issuer;
    await saveStore(store);
  }
  redirectToAuthorization(url: URL) { this.authorizationUrl = url; }
  async saveCodeVerifier(value: string) { await saveStore({ ...(await loadStore()), codeVerifier: value }); }
  async codeVerifier() {
    const value = (await loadStore()).codeVerifier;
    if (!value) throw new Error("UBERSUGGEST_CODE_VERIFIER_MISSING");
    return value;
  }
  async saveDiscoveryState(value: OAuthDiscoveryState) {
    assertPinnedDiscoveryState(value);
    await saveStore({ ...(await loadStore()), discoveryState: value });
  }
  async discoveryState() {
    const value = (await loadStore()).discoveryState;
    if (value) assertPinnedDiscoveryState(value);
    return value;
  }
  async invalidateCredentials(scope: "all" | "client" | "tokens" | "verifier" | "discovery") {
    const store = await loadStore();
    if (scope === "all" || scope === "client") delete store.clientByIssuer;
    if (scope === "all" || scope === "tokens") delete store.tokensByIssuer;
    if (scope === "all" || scope === "verifier") delete store.codeVerifier;
    if (scope === "all" || scope === "discovery") delete store.discoveryState;
    await saveStore(store);
  }
}

function createConnection() {
  if (!providerLaneAllowed()) throw new Error("UBERSUGGEST_LOCAL_ONLY");
  const provider = new LocalOAuthProvider();
  const transport = new StreamableHTTPClientTransport(SERVER_URL, { authProvider: provider, fetch: providerFetch });
  const client = new Client({ name: "ccpun-control-plane", version: "4.1" });
  return { provider, transport, client };
}

function safeAuthorizationUrl(url: URL | undefined) {
  if (!isSafeExternalAuthorizationUrl(url, PROVIDER_ORIGIN)) {
    throw new Error("UBERSUGGEST_AUTHORIZATION_URL_INVALID");
  }
  return url!.toString();
}

export async function getUbersuggestConnectionStatus() {
  if (!providerLaneAllowed()) return { connected: false, localOnly: true };
  const store = await loadStore();
  const token = store.tokensByIssuer?.[store.lastIssuer ?? ""];
  return { connected: Boolean(token?.access_token || token?.refresh_token), localOnly: true };
}

export async function beginUbersuggestAuthorization() {
  const state = randomBytes(32).toString("base64url");
  await saveStore({ ...(await loadStore()), pending: { state, createdAt: new Date().toISOString() } });
  const { provider, transport, client } = createConnection();
  try {
    await client.connect(transport, { timeout: 15_000 });
    if (provider.authorizationUrl) return { connected: false as const, authorizationUrl: safeAuthorizationUrl(provider.authorizationUrl) };
    const updated = await loadStore();
    delete updated.pending;
    await saveStore(updated);
    return { connected: true as const };
  } catch (error) {
    if (!UnauthorizedError.isInstance(error) && !provider.authorizationUrl) throw new Error("UBERSUGGEST_PROVIDER_UNAVAILABLE");
    if (!provider.authorizationUrl) throw new Error("UBERSUGGEST_AUTHORIZATION_URL_MISSING");
    return { connected: false as const, authorizationUrl: safeAuthorizationUrl(provider.authorizationUrl) };
  } finally {
    await client.close().catch(() => undefined);
  }
}

export async function finishUbersuggestAuthorization(params: URLSearchParams) {
  const store = await loadStore();
  const pending = store.pending;
  const createdAt = pending ? Date.parse(pending.createdAt) : Number.NaN;
  if (!pending || params.get("state") !== pending.state || !Number.isFinite(createdAt) || Date.now() - createdAt > AUTH_MAX_AGE_MS) {
    throw new Error("UBERSUGGEST_AUTH_STATE_INVALID");
  }
  const { transport, client } = createConnection();
  try {
    await transport.finishAuth(params);
    const updated = await loadStore();
    delete updated.pending;
    delete updated.codeVerifier;
    await saveStore(updated);
    await client.connect(transport, { timeout: 15_000 });
  } finally {
    await client.close().catch(() => undefined);
  }
}

function normalizedIntent(value: string | null | undefined): ResearchInput["intent"] {
  const normalized = value?.toLowerCase();
  if (normalized?.includes("inform")) return "informational";
  if (normalized?.includes("transact")) return "transactional";
  if (normalized?.includes("navig")) return "navigational";
  if (normalized?.includes("commercial")) return "commercial";
  return normalized ? "mixed" : undefined;
}

export async function fetchUbersuggestResearch(keyword: string): Promise<ResearchInput> {
  const cleanKeyword = keyword.replace(/\s+/g, " ").trim();
  if (!cleanKeyword || cleanKeyword.length > 300) throw new Error("UBERSUGGEST_KEYWORD_INVALID");
  const { provider, transport, client } = createConnection();
  try {
    await client.connect(transport, { timeout: 15_000 });
    if (provider.authorizationUrl) throw new Error("UBERSUGGEST_AUTH_REQUIRED");
    const [overviewResult, serpResult] = await Promise.all([
      client.callTool({ name: "keyword_overview", arguments: { keyword: cleanKeyword } }, { timeout: KEYWORD_TOOL_TIMEOUT_MS, maxTotalTimeout: KEYWORD_TOOL_TIMEOUT_MS }),
      client.callTool({ name: "serp_analysis", arguments: { keyword: cleanKeyword, limit: 10 } }, { timeout: KEYWORD_TOOL_TIMEOUT_MS, maxTotalTimeout: KEYWORD_TOOL_TIMEOUT_MS }),
    ]);
    if (overviewResult.isError || serpResult.isError) throw new Error("UBERSUGGEST_TOOL_FAILED");
    const overview = overviewSchema.parse(overviewResult.structuredContent);
    const serp = serpSchema.parse(serpResult.structuredContent);
    const entries = serp.serpEntries.filter((entry) => entry.url).slice(0, 10);
    return researchInputSchema.parse({
      keyword: cleanKeyword,
      provider: "ubersuggest",
      scope: overview.location ?? "Global",
      volume: overview.search_volume ?? undefined,
      difficulty: overview.seo_difficulty ?? undefined,
      intent: normalizedIntent(overview.search_intent),
      serp: entries.map((entry) => ({
        position: entry.position ?? undefined,
        title: entry.title ?? undefined,
        url: entry.url ?? undefined,
        domain: entry.domain ?? undefined,
      })),
      competitors: [...new Set(entries.map((entry) => entry.domain).filter((value): value is string => Boolean(value)))],
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (UnauthorizedError.isInstance(error) || provider.authorizationUrl) throw new Error("UBERSUGGEST_AUTH_REQUIRED");
    if (error instanceof z.ZodError) throw new Error("UBERSUGGEST_INVALID_RESPONSE");
    if (error instanceof Error && (error.name === "TimeoutError" || /timed?\s*out/i.test(error.message))) throw new Error("UBERSUGGEST_TIMEOUT");
    if (error instanceof Error && error.message === "UBERSUGGEST_TOOL_FAILED") throw error;
    throw new Error("UBERSUGGEST_TOOL_FAILED");
  } finally {
    await client.close().catch(() => undefined);
  }
}
