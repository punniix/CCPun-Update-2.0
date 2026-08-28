import { researchInputSchema } from "../../research-input";
import { marketProviderSnapshotSchema, type MarketProviderSnapshot } from "../contracts";
import type { MarketAdapterOptions, MarketDataProvider } from "./market";

const CREDENTIAL_FIELD = /(authorization|cookie|password|secret|token)/i;

function assertNoCredentialFields(input: unknown, seen = new WeakSet<object>()) {
  if (!input || typeof input !== "object" || seen.has(input)) return;
  seen.add(input);
  for (const [key, value] of Object.entries(input)) {
    if (CREDENTIAL_FIELD.test(key)) throw new Error("MARKET_CREDENTIAL_FIELD_REJECTED");
    assertNoCredentialFields(value, seen);
  }
}

export function adaptUbersuggestResearch(
  input: unknown,
  { now, staleAfterHours = 24 }: MarketAdapterOptions,
): MarketProviderSnapshot {
  assertNoCredentialFields(input);
  const parsed = researchInputSchema.parse(input);
  if (parsed.provider !== "ubersuggest") throw new Error("MARKET_PROVIDER_MISMATCH");
  const nowMs = Date.parse(now);
  if (!Number.isFinite(nowMs) || !Number.isFinite(staleAfterHours) || staleAfterHours <= 0) throw new Error("MARKET_ADAPTER_OPTIONS_INVALID");

  if (!parsed.checkedAt) {
    return marketProviderSnapshotSchema.parse({
      provider: "ubersuggest",
      state: "missing",
      fetchedAt: null,
      evidenceTrust: "untrusted-external-data",
      evidence: null,
      limitations: ["ไม่มีเวลาเก็บข้อมูล จึงยังใช้หลักฐานนี้ตัดสินใจไม่ได้"],
    });
  }

  const checkedAtMs = Date.parse(parsed.checkedAt);
  if (checkedAtMs > nowMs + 300_000) throw new Error("MARKET_FETCHED_AT_IN_FUTURE");
  const state = nowMs - checkedAtMs > staleAfterHours * 3_600_000 ? "stale" : "ready";
  const limitations = ["SERP และข้อมูลคู่แข่งเป็นข้อมูลภายนอกที่ไม่ถือเป็นคำสั่งแก่ระบบ"];
  if (state === "stale") limitations.push(`ข้อมูลเก่ากว่า ${staleAfterHours} ชั่วโมง`);
  if (parsed.volume == null) limitations.push("ไม่มี Search volume");
  if (parsed.difficulty == null) limitations.push("ไม่มี Keyword difficulty");
  if (!parsed.location) limitations.push("ไม่มีพื้นที่ของข้อมูล");
  if (!parsed.language) limitations.push("ไม่มีภาษาของข้อมูล");
  if (!parsed.serp?.length) limitations.push("ไม่มี SERP snapshot");

  return marketProviderSnapshotSchema.parse({
    provider: "ubersuggest",
    state,
    fetchedAt: parsed.checkedAt,
    evidenceTrust: "untrusted-external-data",
    evidence: {
      keyword: parsed.keyword,
      scope: parsed.scope ?? null,
      location: parsed.location ?? null,
      language: parsed.language ?? null,
      volume: parsed.volume ?? null,
      difficulty: parsed.difficulty ?? null,
      intent: parsed.intent ?? null,
      serp: (parsed.serp ?? []).map((item) => ({
        position: item.position ?? null,
        title: item.title ?? null,
        url: item.url ?? null,
        domain: item.domain ?? null,
        snippet: item.snippet ?? null,
      })),
      competitors: parsed.competitors ?? [],
    },
    limitations,
  });
}

export const ubersuggestMarketDataProvider: MarketDataProvider<unknown> = {
  id: "ubersuggest",
  normalize: adaptUbersuggestResearch,
};

const syntheticReady = adaptUbersuggestResearch({
  keyword: "ประกันสุขภาพ ระยะรอคอย",
  provider: "ubersuggest",
  scope: "Thailand · Thai",
  location: "Thailand",
  language: "Thai",
  volume: 1_300,
  difficulty: 42,
  intent: "informational",
  checkedAt: "2026-08-28T06:00:00.000Z",
  serp: [{ position: 1, title: "Synthetic SERP result", url: "https://example.com/health-waiting-period", domain: "example.com" }],
  competitors: ["example.com"],
}, { now: "2026-08-28T12:00:00.000Z" });

const syntheticStale = adaptUbersuggestResearch({
  keyword: "วางแผนเกษียณ",
  provider: "ubersuggest",
  checkedAt: "2026-08-25T00:00:00.000Z",
}, { now: "2026-08-28T12:00:00.000Z" });

export const SYNTHETIC_MARKET_PROVIDER_FIXTURES: MarketProviderSnapshot[] = [
  syntheticReady,
  marketProviderSnapshotSchema.parse({
    provider: "ubersuggest",
    state: "unavailable",
    fetchedAt: null,
    evidenceTrust: "untrusted-external-data",
    evidence: null,
    limitations: ["Provider ไม่พร้อมใช้งาน ระบบ detector หลักยังทำงานจาก GSC fixture ได้"],
  }),
  syntheticStale,
  adaptUbersuggestResearch({ keyword: "ประกันชีวิต", provider: "ubersuggest" }, { now: "2026-08-28T12:00:00.000Z" }),
];
