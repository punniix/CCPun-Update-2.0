# Website 4.2 Social Operations Core

Status: local implementation, Preview delivery pending COO approval.

This phase adds a read-only synthetic UAT view for two boundaries:

- deterministic publication planning without provider execution
- published lifecycle records required before analytics can exist
- native social metrics kept separate by platform
- a unified synthetic Content Calendar derived from the same Master Content, variants and publication records
- a fail-closed Facebook Comment Series readiness planner

The route is `/snt-admin/distribution/operations/` and requires `social:read`, the configured Admin origin, and the exact Admin UAT lane. Enable only on `codex/website-42-social-media-integration-20260829` with `CCPUN_SOCIAL_OPERATIONS_ENABLED=1` and `CCPUN_SOCIAL_DATA_MODE=synthetic`.

Analytics fixtures must reference a matching `published` record, the same platform, a provider object ID and a snapshot time after publication. Draft, approved, native-finish and other unpublished records cannot carry analytics.

Live is modeled as a main content format. Phase 1 stores only post-Live historical native metrics when a provider or approved manual import supplies them; it does not poll concurrent viewers during a broadcast. The synthetic YouTube fixture covers average/peak concurrent viewers and watch time after the Live ends. Missing Instagram, Facebook, or TikTok historical fields must remain unavailable rather than being estimated.

Provider snapshots pass through one normalization boundary that always records `manual-post-live`, keeps real-time polling disabled, and forbids provider writes. This is ingestion validation only; it does not connect an account or fetch analytics.

Pure Meta, YouTube and TikTok adapters accept strict metric allowlists, reject unknown credential-shaped fields, and preserve native metric names instead of manufacturing a cross-platform total. They normalize already-fetched evidence only; OAuth, token refresh, API calls and durable analytics storage remain disconnected.

No Social API, OAuth connection, database write, scheduled job, webhook, real account, real post, or real analytics sync exists in this phase. Native metrics are not summed across platforms. Disable the feature flag to roll back the Preview surface.

`/snt-admin/distribution/calendar/` is read-only and uses the same exact-lane guard. It displays current variant state, publishing mode, any synthetic scheduled time and whether historical analytics fixtures exist. It does not create publication jobs or provider requests.

The editor selects either top-level comments or one strictly ordered thread. Thread parents are derived from the approved order when an operational publication is created, so editors do not manually wire IDs. The planner requires a published Main Post with a Platform Post ID, reviewed comments, unique IDs/order, a valid graph, and a published parent Platform Comment ID before a reply becomes eligible. It detects missing parents and bounded cycles. The result always keeps `providerWriteAllowed=false`; idempotent execution, retries, audit insertion and real Meta calls remain blocked until the durable write lane is separately reviewed and approved.
