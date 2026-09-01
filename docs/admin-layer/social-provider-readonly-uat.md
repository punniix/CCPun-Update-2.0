# Social Provider Read-only UAT

This lane prepares owner-triggered Facebook, Instagram, YouTube and TikTok reads without adding a worker, scheduler, token database or provider write capability.

## Exact deployment lane

- Vercel project: `ccpun-admin`
- Environment: Preview only
- Git branch: `codex/website-42-social-provider-readonly-20260831`
- Application lane: `CCPUN_APP_ENV=admin-uat`
- Sanity lane: `ccb9lnw5/uat`
- Existing Social lane: `CCPUN_SOCIAL_OPERATIONS_ENABLED=1`
- Feature gate: `CCPUN_SOCIAL_PROVIDER_READS_ENABLED=1`

`CCPUN_SOCIAL_DATA_MODE` was a synthetic-fixture switch for the older foundation lane. PR57 does not read it; removing it does not enable provider writes.

Never copy these provider credentials to Production. `v4-production`, `admin.ccpun.com`, `ccpun-web` and every other branch remain denied by code.

The Preview must also retain its existing Admin UAT configuration: `AUTH_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `CCPUN_ADMIN_OWNER_EMAILS`, `NEXT_PUBLIC_SANITY_PROJECT_ID=ccb9lnw5`, `NEXT_PUBLIC_SANITY_DATASET=uat` and a server-only `SANITY_API_READ_TOKEN`. This change needs no Sanity write token and no Neon credential.

## Meta manual connection

Required Preview variables for the exact branch:

- `CCPUN_META_ACCESS_TOKEN` — server-only Secret
- `CCPUN_META_GRAPH_VERSION` — Config copied from the approved Meta app's current Graph API version; the application intentionally has no guessed default
- `CCPUN_META_GRANTED_SCOPES` — comma-separated scopes actually granted to the UAT token; reads require at least `pages_show_list,pages_read_engagement,instagram_basic`. Publishing scopes may be present for later UAT, but every provider write remains disabled in this release.
- `CCPUN_META_PAGE_ID` — optional explicit Page selection; required when the account manages more than one Page

The read lane requires the named minimum scopes; extra publishing scopes do not unlock a write by themselves. Manual Sync reads Page/Instagram identity plus native engagement counters for at most 20 recent items. The response never includes the User or Page credential.

### Instagram audio search in the PR57 UAT lane

The owner-triggered audio-search route is read-only and remains restricted to the same authenticated, same-origin Admin UAT lane. It requires the token attestation to include `instagram_basic,instagram_content_publish`; Facebook Page execution separately requires `pages_show_list,pages_read_engagement,pages_manage_posts`. Tokens stay in the `Authorization` header and provider failures log only the endpoint path, HTTP status and Meta error codes.

The server adapter can form Facebook publish-now/native-scheduled requests and Instagram Reel container/audio/media-publish requests. Facebook execution resolves the selected Page access token from `/me/accounts` for each approved operation, keeps it server-only and fails closed if Meta does not return it; no second stored secret is needed. If `CCPUN_META_PAGE_ID` is absent, execution auto-selects only when the token manages exactly one Page. Facebook schedules are validated against Meta's documented 10-minute to 75-day window. Instagram's [Audio API](https://developers.facebook.com/docs/instagram-platform/content-publishing/audio-api/) returns an `audio` array, may expose a smaller third-party-authorized catalog than the native app and does not support a pre-publish Reel preview; any other response shape is rejected.

### Manual Facebook execution in the PR57 UAT lane

The guarded execution route is callable only by an authenticated human owner, from the configured same origin, after an explicit button action. It additionally requires `CCPUN_SOCIAL_PROVIDER_WRITES_ENABLED=1` on the exact PR57 Admin UAT lane. The flag alone cannot create a provider request: a current human-approved publication, matching Sanity revision/version, queued compare-and-swap job, active lease, retry budget and scope attestation must all pass.

The callable executor supports Facebook text and explicit HTTPS Link Posts for publish-now and Meta-native scheduling. It also distinguishes single image (`image-post`/legacy `photo-post`), ordered 2–10 image album (`album`/legacy `carousel`), video and Reel. Media execution accepts only an owner-interactive, memory-only `drive.file` token plus descriptors bound to the exact approved Drive file ID, MIME type, byte size and Sanity revision/version. The server revalidates approved-root ancestry and streams the original binary to Meta; Drive web-view and thumbnail URLs are never publish inputs, and the token is neither stored nor returned. Missing or mismatched descriptors fail before Meta. There is no cron, background poller or automatic retry runner. Only a Meta rate-limit failure is eligible for another owner-triggered attempt; timeout, provider-unavailable and post-provider database uncertainty stop for manual reconciliation to avoid a duplicate Page post.

One Sanity variant revision/version has one database execution identity even if its pending schedule changes. An inactive Facebook job is amended under a row lock and job-version compare-and-swap; active or completed execution is not duplicated. The database also enforces a unique approved-snapshot index.

Instagram mobile handoff never calls Meta. Instagram direct/Reel execution remains fail-closed until its approved media record supplies a trusted HTTPS delivery URL; the executor never accepts a client-provided delivery URL. Audio search remains read-only. No provider call, token read-back or deploy is part of this implementation verification.

## YouTube manual connection

Required Preview variables for the exact branch:

- `CCPUN_YOUTUBE_ACCESS_TOKEN` — server-only Secret
- `CCPUN_YOUTUBE_GRANTED_SCOPES=https://www.googleapis.com/auth/youtube.readonly`

One owner click reads the authorized Channel and at most 20 recent uploads with native view, like and comment counters. Watch time and retention remain deferred until the owner approves `yt-analytics.readonly`; upload/update/delete scopes are rejected.

## TikTok manual connection

Required Preview variables for the exact branch:

- `CCPUN_TIKTOK_ACCESS_TOKEN` — server-only Secret
- `CCPUN_TIKTOK_GRANTED_SCOPES=user.info.basic,video.list`

The accepted scope set follows TikTok's Display API read permissions. `video.upload` and `video.publish` are not accepted. One owner click reads the authorized profile and at most 20 recent public videos with their native historical counters. TikTok documents these read endpoints at [Display API](https://developers.tiktok.com/docs/en/display-api-get-started), [List Videos](https://developers.tiktok.com/docs/en/tiktok-api-v2-video-list) and [Scopes](https://developers.tiktok.com/docs/en/tiktok-api-scopes).

## Current persistence boundary

- no token, raw provider response, metric, Page selection or cursor is persisted
- no background refresh, webhook, polling loop or cron exists
- TikTok metrics enter the internal normalized contract only when a video ID exactly matches an existing TikTok `platformObjectId`; unmatched IDs remain explicit
- Meta reach/deep Insights and YouTube watch-time remain deferred until the owner separately approves the additional read permissions
- Neon remains the future owner of selected provider IDs, cursors, sync state and historical metric snapshots; this PR does not add or apply a migration

This keeps the first UAT credential rotation reversible and adds no fixed infrastructure cost.
