# Social Provider Read-only UAT

This lane prepares owner-triggered Facebook, Instagram and TikTok reads without adding a worker, scheduler, token database or provider write capability.

## Exact deployment lane

- Vercel project: `ccpun-admin`
- Environment: Preview only
- Git branch: `codex/website-42-social-provider-readonly-20260831`
- Application lane: `CCPUN_APP_ENV=admin-uat`
- Sanity lane: `ccb9lnw5/uat`
- Existing Social lane: `CCPUN_SOCIAL_OPERATIONS_ENABLED=1`
- Existing data mode: `CCPUN_SOCIAL_DATA_MODE=synthetic`
- Feature gate: `CCPUN_SOCIAL_PROVIDER_READS_ENABLED=1`

Never copy these provider credentials to Production. `v4-production`, `admin.ccpun.com`, `ccpun-web` and every other branch remain denied by code.

The Preview must also retain its existing Admin UAT configuration: `AUTH_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `CCPUN_ADMIN_OWNER_EMAILS`, `NEXT_PUBLIC_SANITY_PROJECT_ID=ccb9lnw5`, `NEXT_PUBLIC_SANITY_DATASET=uat` and a server-only `SANITY_API_READ_TOKEN`. This change needs no Sanity write token and no Neon credential.

## Meta manual connection

Required Preview variables for the exact branch:

- `CCPUN_META_ACCESS_TOKEN` — server-only Secret
- `CCPUN_META_GRAPH_VERSION` — Config copied from the approved Meta app's current Graph API version; the application intentionally has no guessed default
- `CCPUN_META_GRANTED_SCOPES=pages_show_list,instagram_basic`

The accepted scope set is exact. Publishing, Page-management and Insights permissions are rejected in this phase. Manual Sync reads `/me/accounts` with a Bearer header and requests only Page identity plus the linked Instagram business account identity. The response never includes the credential.

## TikTok manual connection

Required Preview variables for the exact branch:

- `CCPUN_TIKTOK_ACCESS_TOKEN` — server-only Secret
- `CCPUN_TIKTOK_GRANTED_SCOPES=user.info.basic,video.list`

The accepted scope set follows TikTok's Display API read permissions. `video.upload` and `video.publish` are not accepted. One owner click reads the authorized profile and at most 20 recent public videos with their native historical counters. TikTok documents these read endpoints at [Display API](https://developers.tiktok.com/docs/en/display-api-get-started), [List Videos](https://developers.tiktok.com/docs/en/tiktok-api-v2-video-list) and [Scopes](https://developers.tiktok.com/docs/en/tiktok-api-scopes).

## Current persistence boundary

- no token, raw provider response, metric, Page selection or cursor is persisted
- no background refresh, webhook, polling loop or cron exists
- TikTok metrics enter the internal normalized contract only when a video ID exactly matches an existing TikTok `platformObjectId`; unmatched IDs remain explicit
- Meta Insights remains deferred until account discovery passes and the owner separately approves the additional read permissions
- Neon remains the future owner of selected provider IDs, cursors, sync state and historical metric snapshots; this PR does not add or apply a migration

This keeps the first UAT credential rotation reversible and adds no fixed infrastructure cost.
