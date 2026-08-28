# Website 4.2 Social Operations Core

Status: local implementation, Preview delivery pending COO approval.

This phase adds a read-only synthetic UAT view for two boundaries:

- deterministic publication planning without provider execution
- published lifecycle records required before analytics can exist
- native social metrics kept separate by platform
- a unified synthetic Content Calendar derived from the same Master Content, variants and publication records

The route is `/snt-admin/distribution/operations/` and requires `social:read`, the configured Admin origin, and the exact Admin UAT lane. Enable only on `codex/website-42-social-operations-core-20260828` with `CCPUN_SOCIAL_OPERATIONS_ENABLED=1` and `CCPUN_SOCIAL_DATA_MODE=synthetic`.

Analytics fixtures must reference a matching `published` record, the same platform, a provider object ID and a snapshot time after publication. Draft, approved, native-finish and other unpublished records cannot carry analytics.

No Social API, OAuth connection, database write, scheduled job, webhook, real account, real post, or real analytics sync exists in this phase. Native metrics are not summed across platforms. Disable the feature flag to roll back the Preview surface.

`/snt-admin/distribution/calendar/` is read-only and uses the same exact-lane guard. It displays current variant state, publishing mode, any synthetic scheduled time and whether historical analytics fixtures exist. It does not create publication jobs or provider requests.
