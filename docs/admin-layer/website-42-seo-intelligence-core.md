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

This batch does not call GSC, GA4, Ubersuggest or a paid provider; persist opportunities; generate AI proposals; mutate Sanity; apply Draft changes; publish content; or change URL, canonical, redirect, sitemap, robots, analytics or consent contracts. Provider normalization, manual sync and persistent opportunity lifecycle remain separate later batches.
