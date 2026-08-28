# Website 4.2 SEO Intelligence Core

Status: synthetic, read-only Admin UAT foundation.

This batch adds deterministic detectors for CTR underperformance, position 4–15 opportunities, content decay and persistent query/page cannibalization. It uses fixed synthetic observations only. The provisional CTR baseline, detector thresholds, priority components, evidence and limitations are visible in code and the Admin UAT page.

Activation requires all of the following:

- `CCPUN_SEO_INTELLIGENCE_ENABLED=1`
- Admin UAT environment
- `ccpun-admin` Vercel project identity
- exact branch `codex/website-42-seo-ga4-manual-sync-20260828`
- Sanity UAT project `ccb9lnw5` and dataset `uat`

The API is authenticated, requires `seo:read`, checks the configured Admin origin and exposes GET only. The page and API return 404 when any activation guard differs.

The GSC boundary validates provider responses, maps keys by the exact requested dimension order, supports operator-selected date ranges up to 90 days and paginates at 25,000 rows up to a bounded 50,000-row result per range. It uses finalized web data, one bounded retry and a 15-second timeout. Google documents that Search Analytics may still omit anonymized/low-volume rows and does not guarantee every possible query.

`POST /api/snt-admin/seo/opportunities/sync/gsc/` is the only caller. It runs only after an authenticated human with `research:provider-query` permission presses the manual Sync control on the exact Admin UAT lane. It fetches the selected and preceding equal-length ranges, returns counts plus at most 100 current rows, and persists nothing. It never runs during page rendering.

`POST /api/snt-admin/seo/opportunities/sync/ga4/` adds the same human-triggered, read-only boundary for Organic Search landing pages. It requests only `landingPage`, `sessions` and `engagedSessions`, derives engagement rate deterministically and compares the selected range with the preceding equal-length range. The call is limited to 10,000 rows per range, returns at most 100 sample rows to the Admin UI, reports sampling/thresholding/other-row limitations when Google supplies them, and persists nothing. If the current range succeeds but the comparison fails, the result is explicitly partial.

GA4 event outcomes are deferred. The repository has protected analytics event names, but this batch does not duplicate them into a second reporting allowlist or assume every event is a business outcome. A later batch must verify the live property compatibility and establish one approved reporting registry without renaming analytics or consent contracts.

The market boundary is provider-neutral and currently has one pure Ubersuggest adapter. It accepts only the existing validated research shape, rejects credential-shaped input, labels SERP evidence as untrusted external data and represents `ready`, `unavailable`, `stale` and `missing` states. The Admin page displays deterministic fixtures for all four fallback states. The adapter performs no provider call, reads no environment variable and does not activate a paid service.

The pure GSC observation assembler can now join validated current and previous rows by the exact page, query, device and country dimensions. It emits detector-ready observations only when the caller supplies complete editorial context: query cluster, intent, intent alignment, indexability, business value, seasonality and last relevant content change. Missing or ambiguous context is skipped, absolute and relative URLs are never guessed to be equivalent, comparison provenance and provider limitations remain explicit, and the assembler performs no provider call or persistence.

The manual-sync route does not invoke this assembler yet because no approved editorial-context registry is connected. GA4 outcomes also remain separate until an approved event registry and landing-page ownership contract exist. This keeps the current operator response read-only and prevents provider rows from silently becoming recommendations without required editorial evidence.

This batch does not call Ubersuggest or a paid provider; persist observations or opportunities; generate AI proposals; mutate Sanity; apply Draft changes; publish content; or change URL, canonical, redirect, sitemap, robots, analytics or consent contracts. Search appearance remains deferred because Google documents it as a separate two-step query. Persistent sync runs, route integration and the opportunity lifecycle remain separate later batches.
