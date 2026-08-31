import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { marketProviderSnapshotSchema } from "../../lib/admin/seo-intelligence/contracts";
import { adaptUbersuggestResearch, SYNTHETIC_MARKET_PROVIDER_FIXTURES, ubersuggestMarketDataProvider } from "../../lib/admin/seo-intelligence/providers/ubersuggest";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("Ubersuggest adapter maps validated evidence without a provider call", () => {
  const snapshot = ubersuggestMarketDataProvider.normalize({
    keyword: "ประกันสุขภาพ",
    provider: "ubersuggest",
    location: "Thailand",
    language: "Thai",
    volume: 900,
    difficulty: 38,
    checkedAt: "2026-08-28T08:00:00.000Z",
    serp: [{ position: 1, url: "https://example.com/result" }],
  }, { now: "2026-08-28T12:00:00.000Z" });
  assert.equal(snapshot.state, "ready");
  assert.equal(snapshot.evidence?.volume, 900);
  assert.equal(snapshot.evidence?.location, "Thailand");
  assert.equal(snapshot.evidence?.language, "Thai");
  assert.equal(snapshot.evidence?.serp[0]?.position, 1);
  assert.equal(snapshot.evidenceTrust, "untrusted-external-data");
  const source = read("lib/admin/seo-intelligence/providers/ubersuggest.ts");
  assert.doesNotMatch(source, /fetch\(|callUbersuggestTools|server-only|process\.env|console\./);
});

test("Synthetic market fixtures cover ready, unavailable, stale and missing states", () => {
  assert.deepEqual(SYNTHETIC_MARKET_PROVIDER_FIXTURES.map((fixture) => fixture.state), ["ready", "unavailable", "stale", "missing"]);
  for (const fixture of SYNTHETIC_MARKET_PROVIDER_FIXTURES) assert.equal(marketProviderSnapshotSchema.safeParse(fixture).success, true);
  assert.equal(SYNTHETIC_MARKET_PROVIDER_FIXTURES[1]?.evidence, null);
  assert.match(SYNTHETIC_MARKET_PROVIDER_FIXTURES[2]?.limitations.join(" ") ?? "", /ข้อมูลเก่ากว่า/);
  assert.equal(marketProviderSnapshotSchema.safeParse({ ...SYNTHETIC_MARKET_PROVIDER_FIXTURES[0], evidence: null }).success, false);
});

test("Adapter rejects provider mismatch, credential-shaped input and future evidence", () => {
  assert.throws(() => adaptUbersuggestResearch({ keyword: "x", provider: "manual", checkedAt: "2026-08-28T08:00:00.000Z" }, { now: "2026-08-28T12:00:00.000Z" }), /MARKET_PROVIDER_MISMATCH/);
  assert.throws(() => adaptUbersuggestResearch({ keyword: "x", provider: "ubersuggest", token: "must-not-enter-domain" }, { now: "2026-08-28T12:00:00.000Z" }), /MARKET_CREDENTIAL_FIELD_REJECTED/);
  assert.throws(() => adaptUbersuggestResearch({ keyword: "x", provider: "ubersuggest", serp: [{ secret: "must-not-enter-domain" }] }, { now: "2026-08-28T12:00:00.000Z" }), /MARKET_CREDENTIAL_FIELD_REJECTED/);
  assert.throws(() => adaptUbersuggestResearch({ keyword: "x", provider: "ubersuggest", checkedAt: "2026-08-28T13:00:00.000Z" }, { now: "2026-08-28T12:00:00.000Z" }), /MARKET_FETCHED_AT_IN_FUTURE/);
  assert.throws(() => adaptUbersuggestResearch({ keyword: "x", provider: "ubersuggest" }, { now: "invalid" }), /MARKET_ADAPTER_OPTIONS_INVALID/);
});

test("Organic performance UI no longer mixes synthetic market-provider cards", () => {
  const page = read("features/admin/seo/opportunities/page.tsx");
  assert.doesNotMatch(page, /Market provider states/);
  assert.doesNotMatch(page, /สถานะจำลอง/);
  assert.doesNotMatch(page, /untrusted external data/);
  assert.doesNotMatch(page, /refreshMarket|syncMarket|connectUbersuggest/);
});
