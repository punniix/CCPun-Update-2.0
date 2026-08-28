import assert from "node:assert/strict";
import test from "node:test";
import {
  hasUbersuggestCredentials,
  isUbersuggestAuthorizationStateValid,
  isUbersuggestSnapshotFresh,
  normalizeUbersuggestResearch,
  UBERSUGGEST_AUTH_MAX_AGE_MS,
} from "../../lib/admin/ubersuggest-contracts";

const now = Date.parse("2026-08-29T00:00:00.000Z");

test("partial provider payload remains usable without invented metrics", () => {
  assert.deepEqual(normalizeUbersuggestResearch({
    keyword: "ประกันสุขภาพ",
    overview: { search_intent: "informational" },
    serp: { serpEntries: [{ position: 1, title: "ไม่มี URL จึงไม่ควรนำเข้า" }] },
    checkedAt: "2026-08-29T00:00:00.000Z",
  }), {
    keyword: "ประกันสุขภาพ",
    provider: "ubersuggest",
    scope: "Global",
    volume: undefined,
    difficulty: undefined,
    intent: "informational",
    serp: [],
    competitors: [],
    checkedAt: "2026-08-29T00:00:00.000Z",
  });
});

test("OAuth state rejects mismatch, expiry, and future timestamps", () => {
  const current = { state: "expected", createdAt: new Date(now).toISOString() };
  const expired = { state: "expected", createdAt: new Date(now - UBERSUGGEST_AUTH_MAX_AGE_MS - 1).toISOString() };
  const future = { state: "expected", createdAt: new Date(now + 1).toISOString() };
  assert.equal(isUbersuggestAuthorizationStateValid(current, "expected", now), true);
  assert.equal(isUbersuggestAuthorizationStateValid(current, "wrong", now), false);
  assert.equal(isUbersuggestAuthorizationStateValid(expired, "expected", now), false);
  assert.equal(isUbersuggestAuthorizationStateValid(future, "expected", now), false);
});

test("stale snapshots and reconnect credentials remain explicit", () => {
  assert.equal(isUbersuggestSnapshotFresh("2026-08-28T23:30:00.000Z", 1, now), true);
  assert.equal(isUbersuggestSnapshotFresh("2026-08-28T22:59:59.999Z", 1, now), false);
  assert.equal(isUbersuggestSnapshotFresh("2026-08-29T00:00:00.001Z", 1, now), false);
  assert.equal(hasUbersuggestCredentials({ refresh_token: "refresh-only" }), true);
  assert.equal(hasUbersuggestCredentials({ access_token: "access-only" }), true);
  assert.equal(hasUbersuggestCredentials({ access_token: "", refresh_token: "" }), false);
  assert.equal(hasUbersuggestCredentials(undefined), false);
});
