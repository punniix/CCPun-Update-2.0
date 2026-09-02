# CCPun Social Marketing Mart P0

## Purpose

Add a decision-useful marketing layer without changing or overwriting provider truth. Existing `social_provider_content`, revisions, and provider metric snapshots remain the raw/history source of truth.

## Added logical layer

- `ccpun_social.marketing_content_current` — one current provider-content row per provider object; revisions are not counted as separate marketing posts. Enriches linked `publication_id`, `variant_id`, and `master_content_id` when known.
- `ccpun_social.social_metric_capability` — records which marketing metrics are currently requested by the CCPun collector versus not yet requested/unsupported.
- `ccpun_social.post_metric_status` — long-form metric availability. Missing requested metrics become `not_returned`; metrics the collector does not request remain `not_requested`. Missing is never converted to zero.
- `ccpun_social.post_performance_snapshot` — normalized snapshot view with Bangkok time, normalized media format, post age, measurement-window classification, known engagement metrics, and ratio fields that remain NULL without valid Reach.
- `ccpun_social.social_data_quality_review` / `post_data_quality` — preserves provider values and flags suspicious Facebook Share observations for review rather than rewriting them.

## Meta capability at this release

Currently requested and observed by the collector:

Facebook:

- reactions total (raw native key remains `facebook.likes` for backward compatibility)
- comments total
- shares

Instagram:

- likes
- comments total

Not currently requested and therefore not assumed available:

- Facebook reach, impressions, saves
- Instagram reach, impressions, saves, shares

These remain NULL / `not_requested` until a separate Meta API capability audit proves availability and the collector is intentionally expanded.

## Time handling

Source UTC timestamps remain unchanged. Marketing views derive:

- `published_at_bkk`
- `publish_date_bkk`
- ISO day of week
- Bangkok publish hour

Snapshot windows are observational buckets, not claims that a collector ran at an exact instant:

- `24h`: actual post age 18–30 hours
- `7d`: actual post age 144–192 hours
- `28d`: actual post age 600–744 hours
- otherwise `latest`

`post_age_hours` is always retained so analyses can see the actual measurement age.

## Format normalization

Provider-native values are preserved. `format_standard` is derived conservatively. In particular, Facebook `added_photos` maps to `image`, not automatically to `multi_image`, because the current provider payload does not prove asset count.

## Ratio policy

`engagement_rate_by_reach` and `deep_engagement_rate` return NULL whenever Reach is missing or zero. P0 does not substitute follower counts or invent denominators.

Creator-vs-audience comments are intentionally not calculated yet because the current Meta collector retrieves comment totals, not comment-author identity.

## Facebook Share QA

The raw `facebook.shares` value is never rewritten. P0 flags a snapshot as `needs_review` when shares exceed five times `reactions_total` with a positive reactions denominator. Non-flagged rows remain `unreviewed` until provider definition/source verification is performed.

## Runtime safety

The restricted `ccpun_social_runtime` role receives SELECT only on the new capability/QA metadata and marketing views. It receives no write privilege to the QA review table from this migration.

No Sanity schema/content changes, provider writes, social publication, cron, or recurring sync are introduced.

## Next steps after P0

1. Apply migration only after explicit Production schema approval and run the exact readback.
2. Validate the marketing views against existing historical Meta data before changing current Admin dashboards.
3. Audit Meta API capability for Reach/Impressions first, then Instagram saves/shares and video metrics.
4. Add first-party content dimensions (pillar/topic/product/hook/CTA/funnel) in a separate additive migration.
5. Only after exposure metrics exist, introduce normalized benchmarking and percentile views.
