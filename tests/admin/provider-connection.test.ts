import assert from "node:assert/strict";
import test from "node:test";
import { transitionProviderConnection } from "../../lib/admin/provider-connection";

test("Provider connection lifecycle stores state metadata without credentials", () => {
  const disconnected = {
    provider: "meta" as const,
    state: "disconnected" as const,
    scopes: [],
    expiresAt: null,
    lastErrorCategory: null,
  };
  const pending = transitionProviderConnection(disconnected, { type: "begin" });
  const connected = transitionProviderConnection(pending, {
    type: "connected",
    scopes: ["pages_show_list", "instagram_basic", "pages_show_list"],
    expiresAt: "2026-08-29T12:00:00.000Z",
  });
  assert.deepEqual(connected.scopes, ["instagram_basic", "pages_show_list"]);
  assert.equal(transitionProviderConnection(connected, { type: "expired" }).state, "refresh-required");
  assert.equal(transitionProviderConnection(connected, { type: "revoked" }).state, "revoked");
  assert.equal(/token|secret/i.test(JSON.stringify(connected)), false);
});
