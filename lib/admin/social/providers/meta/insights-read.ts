import { z } from "zod";

if (typeof window !== "undefined") throw new Error("META_INSIGHTS_SERVER_ONLY");

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type InsightValue = number | Record<string, number>;

const numericRecordSchema = z.record(z.string(), z.number().nonnegative());
const insightValueSchema = z.union([z.number().nonnegative(), numericRecordSchema]);
const insightResponseSchema = z.object({
  data: z.array(z.object({
    name: z.string().trim().min(1).max(120),
    values: z.array(z.object({ value: insightValueSchema })).max(100).optional(),
    total_value: z.object({ value: insightValueSchema }).optional(),
  }).passthrough()).max(30),
});

function safeGraphError(status: number, body: unknown) {
  const parsed = z.object({ error: z.object({ code: z.number().optional(), error_subcode: z.number().optional() }).optional() }).safeParse(body);
  return {
    status,
    code: parsed.success ? parsed.data.error?.code : undefined,
    subcode: parsed.success ? parsed.data.error?.error_subcode : undefined,
  };
}

async function insightRequest(
  version: string,
  objectId: string,
  metrics: readonly string[],
  token: string,
  fetcher: FetchLike,
) {
  const url = new URL(`https://graph.facebook.com/${version}/${encodeURIComponent(objectId)}/insights`);
  url.searchParams.set("metric", metrics.join(","));
  let response: Response;
  try {
    response = await fetcher(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) return { ok: false as const, retryIndividually: false, error: "timeout" as const };
    return { ok: false as const, retryIndividually: false, error: "unavailable" as const };
  }
  const body = await response.json().catch(() => null) as unknown;
  if (!response.ok) {
    const graph = safeGraphError(response.status, body);
    const retryIndividually = graph.code === 100 && metrics.length > 1;
    return { ok: false as const, retryIndividually, error: "provider" as const, graph };
  }
  const parsed = insightResponseSchema.safeParse(body);
  if (!parsed.success) return { ok: false as const, retryIndividually: false, error: "invalid-response" as const };
  const values = new Map<string, InsightValue>();
  for (const item of parsed.data.data) {
    const value = item.total_value?.value ?? item.values?.at(-1)?.value;
    if (value !== undefined) values.set(item.name, value);
  }
  return { ok: true as const, values };
}

export async function fetchMetaInsights(
  input: { version: string; objectId: string; metrics: readonly string[]; token: string },
  fetcher: FetchLike = fetch,
) {
  const metrics = [...new Set(input.metrics)].filter((metric) => /^[a-z0-9_]{1,120}$/.test(metric)).slice(0, 12);
  if (metrics.length === 0) return new Map<string, InsightValue>();
  const combined = await insightRequest(input.version, input.objectId, metrics, input.token, fetcher);
  if (combined.ok) return combined.values;
  if (!combined.retryIndividually) return new Map<string, InsightValue>();

  const values = new Map<string, InsightValue>();
  for (const metric of metrics) {
    const result = await insightRequest(input.version, input.objectId, [metric], input.token, fetcher);
    if (result.ok) for (const [key, value] of result.values) values.set(key, value);
  }
  return values;
}

export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
) {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function run() {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index]!, index);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, items.length || 1)) }, () => run()));
  return results;
}

export function numberInsight(values: Map<string, InsightValue>, key: string) {
  const value = values.get(key);
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function reactionBreakdownInsight(values: Map<string, InsightValue>, key: string) {
  const value = values.get(key);
  if (!value || typeof value === "number") return {};
  const pick = (...names: string[]) => {
    for (const name of names) {
      const candidate = value[name];
      if (typeof candidate === "number" && Number.isFinite(candidate) && candidate >= 0) return candidate;
    }
    return undefined;
  };
  return {
    like: pick("like", "LIKE"),
    love: pick("love", "LOVE"),
    care: pick("care", "CARE"),
    wow: pick("wow", "WOW"),
    haha: pick("haha", "HAHA"),
    sad: pick("sad", "SAD", "sorry", "SORRY"),
    angry: pick("angry", "ANGRY", "anger", "ANGER"),
  };
}
