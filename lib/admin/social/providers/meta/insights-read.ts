import { z } from "zod";

if (typeof window !== "undefined") throw new Error("META_INSIGHTS_SERVER_ONLY");

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export type MetaInsightValue = number | Record<string, number>;
export type MetaInsightStatus = "available" | "not_returned" | "unsupported" | "permission_denied" | "rate_limited" | "fetch_error";
export type MetaInsightObservation = { metric: string; status: MetaInsightStatus; value?: MetaInsightValue };

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

function classifyFailure(status: number, body: unknown): MetaInsightStatus {
  const graph = safeGraphError(status, body);
  if (status === 401 || status === 403 || graph.code === 10 || graph.code === 190 || graph.code === 200) return "permission_denied";
  if (status === 429 || graph.code === 4 || graph.code === 17 || graph.code === 32 || graph.code === 613) return "rate_limited";
  if (graph.code === 100) return "unsupported";
  return "fetch_error";
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
  } catch {
    return { ok: false as const, retryIndividually: false, status: "fetch_error" as const };
  }
  const body = await response.json().catch(() => null) as unknown;
  if (!response.ok) {
    const status = classifyFailure(response.status, body);
    return { ok: false as const, retryIndividually: status === "unsupported" && metrics.length > 1, status };
  }
  const parsed = insightResponseSchema.safeParse(body);
  if (!parsed.success) return { ok: false as const, retryIndividually: false, status: "fetch_error" as const };
  const values = new Map<string, MetaInsightValue>();
  for (const item of parsed.data.data) {
    const value = item.total_value?.value ?? item.values?.at(-1)?.value;
    if (value !== undefined) values.set(item.name, value);
  }
  return { ok: true as const, values };
}

function sanitizeMetrics(metrics: readonly string[]) {
  return [...new Set(metrics)].filter((metric) => /^[a-z0-9_]{1,120}$/.test(metric)).slice(0, 12);
}

export async function fetchMetaInsightsDetailed(
  input: { version: string; objectId: string; metrics: readonly string[]; token: string },
  fetcher: FetchLike = fetch,
): Promise<MetaInsightObservation[]> {
  const metrics = sanitizeMetrics(input.metrics);
  if (metrics.length === 0) return [];

  const combined = await insightRequest(input.version, input.objectId, metrics, input.token, fetcher);
  if (combined.ok) {
    return metrics.map((metric) => combined.values.has(metric)
      ? { metric, status: "available" as const, value: combined.values.get(metric)! }
      : { metric, status: "not_returned" as const });
  }
  if (!combined.retryIndividually) {
    return metrics.map((metric) => ({ metric, status: combined.status }));
  }

  const observations: MetaInsightObservation[] = [];
  for (const metric of metrics) {
    const result = await insightRequest(input.version, input.objectId, [metric], input.token, fetcher);
    if (!result.ok) {
      observations.push({ metric, status: result.status });
      continue;
    }
    observations.push(result.values.has(metric)
      ? { metric, status: "available", value: result.values.get(metric)! }
      : { metric, status: "not_returned" });
  }
  return observations;
}

export async function fetchMetaInsights(
  input: { version: string; objectId: string; metrics: readonly string[]; token: string },
  fetcher: FetchLike = fetch,
) {
  const observations = await fetchMetaInsightsDetailed(input, fetcher);
  return new Map(observations.flatMap((observation) => observation.status === "available" && observation.value !== undefined
    ? [[observation.metric, observation.value] as const]
    : []));
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

export function numberInsight(values: Map<string, MetaInsightValue>, key: string) {
  const value = values.get(key);
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function reactionBreakdownInsight(values: Map<string, MetaInsightValue>, key: string) {
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
