# CCPun Social Marketing Mart P1 — Meta Insights Collector

## Purpose

Expand the manual Meta analytics collector only for Insights metrics proven available by the live Production capability probe from PR #63. Raw provider content and existing metric history remain unchanged and append-only/change-only.

## Collection boundary

Insights are collected only during the existing manual historical analytics sync. The ordinary Meta discovery action remains lightweight and does not request Insights.

The manual sync keeps the existing 14-day overlap and adds a bounded latest-content Insights backfill:

- up to 25 latest Facebook posts
- up to 25 latest Instagram media items
- maximum concurrency 5
- one combined Insights request per object when supported
- if Meta rejects a combined request because one metric is invalid, the collector retries those metric names individually so one unsupported metric does not discard valid metrics

This avoids a one-shot 380-object Insights backfill and reduces timeout/rate-limit risk.

## Proven Facebook P1 metrics

Collected from post Insights:

- `post_media_view` -> `facebook.views`
- `post_clicks` -> `facebook.clicks`
- `post_reactions_by_type_total` -> reaction breakdown:
  - `facebook.reaction_like`
  - `facebook.reaction_love`
  - `facebook.reaction_care`
  - `facebook.reaction_wow`
  - `facebook.reaction_haha`
  - `facebook.reaction_sad`
  - `facebook.reaction_angry`

Facebook Reach/legacy Impressions are not added in P1 because the current live capability verification established current media-view/click metrics instead of relying on deprecated legacy impression assumptions.

## Proven Instagram P1 metrics

Collected from media Insights:

- `views` -> `instagram.views`
- `reach` -> `instagram.reach`
- `saved` -> `instagram.saves`
- `shares` -> `instagram.shares`
- `total_interactions` -> `instagram.total_interactions`

For Instagram video media only:

- `ig_reels_video_view_total_time` -> native milliseconds
- `ig_reels_avg_watch_time` -> native milliseconds

The previously probed `plays` metric is intentionally excluded because the current Production API probe returned `unsupported_or_invalid`.

## Missing vs zero

A metric is written only when Meta returns a numeric value. Missing responses are not converted to zero.

Marketing Mart capability rows mark P1 metrics as `requested`. If a requested metric is absent from a snapshot it remains `not_returned`. Reel watch metrics are scoped to normalized `video`; non-video content is marked `unsupported` rather than `not_returned`.

## Marketing Mart

The additive P1 migration:

- adds `applies_to_format` to `social_metric_capability`
- updates proven Meta capability rows to `requested`
- extends `post_performance_snapshot` with Views, Clicks, Total Interactions, reaction breakdown, and Reel watch-time columns
- retains the existing Reach-based ratio guard: ratios are NULL when Reach is missing or zero

No raw provider table is renamed, deleted, truncated, or rewritten.

## Units

Reel total/average watch time is preserved in provider-native milliseconds. The shared metric contract and Sheets export accept `milliseconds` without converting the raw observation.

## Safety

- Meta calls are GET-only
- tokens remain Bearer headers and never appear in URLs or logs
- `providerWriteAllowed` remains false
- no social publish/edit/delete/comment action is enabled
- no Sanity mutation
- no background cron
- no Production migration is applied by opening the PR

## Production activation sequence

1. Merge/deploy the reviewed source change after explicit owner approval.
2. Apply `20260902_social_marketing_mart_p1_meta_insights` to Production Neon as database owner.
3. Run the exact P1 migration readback.
4. Trigger one manual Meta historical sync from Admin.
5. Verify new provider metric families in Neon and confirm missing-vs-zero behavior.
6. Only then update decision-oriented Admin UI/export behavior if desired.
