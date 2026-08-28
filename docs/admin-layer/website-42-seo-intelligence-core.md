# Website 4.2 SEO Intelligence Core

Status: synthetic, read-only Admin UAT foundation.

This batch adds deterministic detectors for CTR underperformance, position 4–15 opportunities, content decay and persistent query/page cannibalization. It uses fixed synthetic observations only. The provisional CTR baseline, detector thresholds, priority components, evidence and limitations are visible in code and the Admin UAT page.

Activation requires all of the following:

- `CCPUN_SEO_INTELLIGENCE_ENABLED=1`
- Admin UAT environment
- `ccpun-admin` Vercel project identity
- exact branch `codex/website-42-seo-intelligence-core-20260828`
- Sanity UAT project `ccb9lnw5` and dataset `uat`

The API is authenticated, requires `seo:read`, checks the configured Admin origin and exposes GET only. The page and API return 404 when any activation guard differs.

The GSC boundary now validates provider responses, maps keys by the exact requested dimension order, supports configurable date ranges and paginates at 25,000 rows up to a bounded 50,000-row manual-sync result. It uses finalized web data, one bounded retry and a 15-second timeout. Google documents that Search Analytics may still omit anonymized/low-volume rows and does not guarantee every possible query.

No page or route calls this client yet, so this batch does not consume a token or provider quota. It also does not call GA4, Ubersuggest or a paid provider; persist opportunities; generate AI proposals; mutate Sanity; apply Draft changes; publish content; or change URL, canonical, redirect, sitemap, robots, analytics or consent contracts. The authenticated manual-sync route and persistent opportunity lifecycle remain separate later batches.
