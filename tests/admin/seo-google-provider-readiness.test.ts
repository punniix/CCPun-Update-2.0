import assert from "node:assert/strict";
import test from "node:test";
import { getSeoGoogleProviderReadiness } from "../../lib/admin/seo-intelligence/provider-readiness";

test("SEO Google provider readiness validates resource identifiers and never exposes values", () => {
  const missing = getSeoGoogleProviderReadiness("gsc", {});
  assert.equal(missing.status, "configuration-required");
  assert.equal(missing.refreshableConnectionReady, false);

  const gsc = getSeoGoogleProviderReadiness("gsc", {
    CCPUN_GSC_ACCESS_TOKEN: "redacted-token",
    CCPUN_GSC_SITE_URL: "sc-domain:ccpun.com",
  });
  assert.equal(gsc.status, "manual-sync-ready");
  assert.equal(JSON.stringify(gsc).includes("redacted-token"), false);
  assert.equal(gsc.scope, "https://www.googleapis.com/auth/webmasters.readonly");

  const ga4 = getSeoGoogleProviderReadiness("ga4", {
    CCPUN_GA4_ACCESS_TOKEN: "redacted-token",
    CCPUN_GA4_PROPERTY_ID: "G-BAD-ID",
  });
  assert.equal(ga4.status, "configuration-required");
  assert.equal(ga4.required.find((item) => item.name === "CCPUN_GA4_PROPERTY_ID")?.valid, false);
});

