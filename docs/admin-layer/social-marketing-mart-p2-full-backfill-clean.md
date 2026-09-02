# CCPun Social Marketing Mart P2 — Full Meta Insights Backfill and Clean Data

## Goal

Complete the current Meta Insights coverage for every provider-content object already stored in Neon, while preserving the existing raw provider data and exposing a simpler marketing-facing dataset.

The architecture remains:

```text
Raw provider content and metric snapshots
  -> append-only collection evidence
  -> latest metric status and coverage
  -> clean one-row-per-post marketing view
  -> Admin / Google Sheets / statistical analysis
```

P2 does not rename, delete, truncate, or overwrite the raw provider tables.

## Resumable full backfill

The owner-only Production route is:

```text
POST /api/snt-admin/social/analytics/backfill/meta-insights
```

Each call processes the next server-selected batch of at most 50 stored Meta content objects. There is no caller-controlled object ID, cursor, metric list, token, or batch size.

Safety and load boundaries:

- Production Social runtime only
- authenticated human owner only
- exact configured same-origin POST
- Meta Graph GET requests only
- Page token remains in the Authorization header
- concurrency 5
- `maxDuration = 60`
- no background runner or cron
- no provider publication, edit, comment, or delete
- failed provider attempts are retried after previously unattempted content, preventing one old failure from blocking the rest of the inventory

The route is called repeatedly until `remaining=0`. Completed and partial attempts are terminal for this collection profile; failed attempts remain retryable.

## Collection evidence

`social_provider_metric_collection_attempt` records one append-only attempt per content/profile/request. It stores no credentials and no content body.

Each attempt records:

- content identity and platform
- collection profile and provider API version
- request reference and attempt time
- requested canonical metric keys
- per-metric status
- complete / partial / failed outcome
- available count and sanitized failure category

Supported metric status values are:

- `available`
- `not_returned`
- `unsupported`
- `permission_denied`
- `rate_limited`
- `fetch_error`

A zero returned by Meta remains an available numeric zero. An omitted metric remains `not_returned`; it is never converted to zero.

## Snapshot behavior

Provider metric snapshots remain immutable/change-only. The backfill merges the new Insights family with the latest previously stored native metrics.

For a successfully attempted metric:

- `available` replaces the previous value with the new observation
- `not_returned` or `unsupported` removes a stale previous value from the new latest snapshot while preserving the old historical snapshot
- transient failures retain the prior value for audit, mark it stale in the latest status view, and keep the content retryable

A new snapshot is inserted only when the canonical metric set changes.

## Clean marketing views

### `post_performance_latest`

Exactly one latest normalized snapshot per current content object.

### `post_metric_status_latest`

One latest status row per content and capability metric. It distinguishes:

- available
- not returned by Meta
- not yet fetched
- unsupported for that format
- permission denied
- rate limited
- fetch error

It also flags a retained value as stale when the latest collection attempt failed transiently.

### `post_metric_coverage_summary`

Coverage by platform and metric, including total, eligible, available, not-returned, not-fetched, unsupported, not-requested, permission-denied, rate-limited and fetch-error counts. Availability rate excludes format-unsupported and intentionally not-requested rows from the denominator.

### `post_performance_clean`

One marketing-facing row per current post with:

- content / publication / provider identities
- original UTC and derived Asia/Bangkok date-time dimensions
- provider-native and normalized format
- latest native performance metrics
- metric-window and snapshot age
- known engagement and deep-engagement totals
- component completeness
- known-component Reach-based rates only when Reach is valid
- audience-only Reach rates remain NULL until creator-vs-audience comments are collected
- explicit `comment_attribution_status = not_collected`
- Clicks per View only when Views is valid
- coverage count and coverage rate
- Facebook Share QA
- Facebook reaction-definition reconciliation status
- Instagram total-interaction reconciliation status
- overall data-quality and analysis-readiness status

Creator and audience comments remain NULL because author identity has not been collected. P2 does not infer them from total comments. The export therefore labels current normalized rates as known-component rates rather than audience-engagement rates.

## Provider-definition reconciliation

The clean mart does not force native metric families to agree:

- Facebook `reactions.summary.total_count` remains separate from `post_reactions_by_type_total`.
- Instagram `total_interactions` remains separate from the visible sum of Likes + Comments + Shares + Saves.

Rows with observed discrepancies are marked for review rather than rewritten.

## Google Sheets

The raw export remains available and unchanged. P2 adds:

- `Marketing - Posts` — one clean current row per post
- `Marketing - Coverage` — metric coverage and missing-status summary
- `Marketing - QA` — rows requiring provider-definition or data-quality review

Platform-native metric sheets remain in the export for audit and reprocessing.

## Production activation and verification

1. Merge and promote the exact reviewed commit.
2. Apply `20260902_social_marketing_mart_p2_full_backfill_clean` as the Neon database owner.
3. Run the exact P2 readback.
4. Invoke the owner-only backfill route repeatedly until `remaining=0`.
5. Verify 380 current Meta content rows have terminal collection evidence.
6. Confirm raw content count remains unchanged and snapshot history only grows append-only.
7. Review metric coverage, clean-row count, analysis status, and QA flags.
8. Reload the existing Social Stats page and validate Google Sheets export contract.

## Metric collection provenance

The follow-up migration `20260902_social_marketing_mart_p2_metric_provenance` assigns each Meta capability to the collector that actually requested it:

- `meta-base-content-v1` — Facebook reactions total, comments total and shares; Instagram likes and comments total.
- `meta-p1-insights-v1` — Facebook Views, Clicks and reaction breakdown; Instagram Views, Reach, Saves, Shares, Total Interactions and Reel watch time.

This distinction is required for correct missing-data semantics. For example, the base Facebook posts request includes the `shares` field. When Meta omits that field, the status is `not_returned`, not `not_fetched`. Conversely, a P1 Insights metric with no P1 collection attempt remains `not_fetched`.

The correction changes only the derived capability/status layer. It does not rewrite provider content, metric snapshots, collection attempts, or any raw provider value.
