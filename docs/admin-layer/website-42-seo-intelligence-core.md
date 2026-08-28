# Website 4.2 SEO Intelligence Core

Status: synthetic, read-only Admin UAT foundation.

This batch adds deterministic detectors for CTR underperformance, position 4–15 opportunities, content decay and persistent query/page cannibalization. It uses fixed synthetic observations only. The provisional CTR baseline, detector thresholds, priority components, evidence and limitations are visible in code and the Admin UAT page.

Activation requires all of the following:

- `CCPUN_SEO_INTELLIGENCE_ENABLED=1`
- Admin UAT environment
- `ccpun-admin` Vercel project identity
- exact branch `codex/website-42-seo-gsc-manual-sync-20260828`
- Sanity UAT project `ccb9lnw5` and dataset `uat`

The API is authenticated, requires `seo:read`, checks the configured Admin origin and exposes GET only. The page and API return 404 when any activation guard differs.

The GSC boundary validates provider responses, maps keys by the exact requested dimension order, supports operator-selected date ranges up to 90 days and paginates at 25,000 rows up to a bounded 50,000-row result per range. It uses finalized web data, one bounded retry and a 15-second timeout. Google documents that Search Analytics may still omit anonymized/low-volume rows and does not guarantee every possible query.

`POST /api/snt-admin/seo/opportunities/sync/gsc/` is the only caller. It runs only after an authenticated human with `research:provider-query` permission presses the manual Sync control on the exact Admin UAT lane. It fetches the selected and preceding equal-length ranges, returns counts plus at most 100 current rows, and persists nothing. It never runs during page rendering.

This batch does not call GA4, Ubersuggest or a paid provider; persist observations or opportunities; generate AI proposals; mutate Sanity; apply Draft changes; publish content; or change URL, canonical, redirect, sitemap, robots, analytics or consent contracts. Search appearance remains deferred because Google documents it as a separate two-step query. Persistent sync runs and the opportunity lifecycle remain separate later batches.
