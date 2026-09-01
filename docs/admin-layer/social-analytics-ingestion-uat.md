# Social Analytics Ingestion — UAT and Gated Production

This contract adds owner-triggered historical metric snapshots to the exact gated Neon runtime lane. UAT supports Meta/Instagram, YouTube and TikTok; this Production release enables Meta only. Meta also stores a separate provider-native content registry for downstream analysis without pretending imported posts belong to the Admin publishing lifecycle. It does not create infrastructure, store provider tokens or raw provider payloads, poll in the background, or call a provider write endpoint. Deep Meta reach and YouTube watch-time remain deferred until their additional read scopes are approved.

## Exact Preview lane

- Vercel project: `ccpun-admin`
- Environment: Preview only
- Branch: `codex/website-42-social-analytics-ingestion-20260831`
- `CCPUN_APP_ENV=admin-uat`
- `NEXT_PUBLIC_SANITY_PROJECT_ID=ccb9lnw5`
- `NEXT_PUBLIC_SANITY_DATASET=uat`
- `CCPUN_SOCIAL_OPERATIONS_ENABLED=1`
- `CCPUN_SOCIAL_PROVIDER_READS_ENABLED=1`
- `CCPUN_SOCIAL_ANALYTICS_INGESTION_ENABLED=1`
- Provider credentials remain server-only and use only the exact read scope sets documented in `social-provider-readonly-uat.md`

The existing Admin Auth variables remain required. Never bind this lane to `Production`, `v4-production`, `admin.ccpun.com`, or `ccpun-web`.

## Exact gated Production lane

Production support remains fail-closed and is separate from the Preview lane above. It requires all of the following together:

- Vercel environment: `Production`
- Git branch: `v4-production`
- `CCPUN_APP_ENV=production-admin`
- `CCPUN_PRODUCTION_ADMIN_VERCEL_PROJECT_ID` must equal the Vercel-supplied Production Admin `VERCEL_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_PROJECT_ID=kyfxgjnq`
- `NEXT_PUBLIC_SANITY_DATASET=production`
- `CCPUN_SOCIAL_OPERATIONS_ENABLED=1`
- `CCPUN_SOCIAL_PROVIDER_READS_ENABLED=1`
- `CCPUN_SOCIAL_ANALYTICS_INGESTION_ENABLED=1`
- `CCPUN_NEON_PROJECT_ID=lively-bar-43618798`
- `CCPUN_NEON_BRANCH_ID=br-long-resonance-b3ys5xrv`
- `CCPUN_NEON_ENDPOINT_ID=ep-broad-butterfly-b3ro7u8w`
- `CCPUN_NEON_DATABASE=neondb`
- `CCPUN_SOCIAL_DATABASE_URL` must be a Sensitive connection for `ccpun_social_runtime` whose endpoint and database match the four Production identity variables above

Generate the reviewed Production bootstrap with `node scripts/build-social-production-bootstrap.mjs` and its readback with the same command plus `--readback`; both must pass against the exact Production identity before enabling ingestion. Keep `CCPUN_SOCIAL_PROVIDER_WRITES_ENABLED` absent or `0` unless a separate exact Production publishing authorization exists. YouTube and TikTok remain outside this release; do not bind their Production token or scope variables.

## Exact Neon UAT lane

- Project: `young-term-47483330`
- Existing branch ID: `br-crimson-mouse-az7ajkv8`
- Existing compute: `ep-mute-frost-aztvz394`
- Database: `neondb`
- Runtime role: `ccpun_social_runtime`

Apply the complete `db/migrations/20260831_website_42_social_analytics_ingestion.sql` and then `db/migrations/20260901_website_42_social_provider_native_history.sql` in Neon SQL Editor using the existing UAT owner role only after each migration's prerequisite ledger rows match their frozen checksums. Do not apply them to any other project, branch, endpoint or database. Then run the matching `*_readback.sql` files; every returned boolean must be `t`.

Bind `CCPUN_SOCIAL_DATABASE_URL` as a Sensitive connection for `ccpun_social_runtime` to the exact Preview branch only. Never bind an owner role. The application parses the runtime role, exact UAT endpoint and database directly from this URL, then re-verifies `current_user`, `current_database()`, `ccpun_social.system_identity` and every required migration checksum before each database operation. The duplicate `CCPUN_NEON_PROJECT_ID`, `CCPUN_NEON_BRANCH_ID`, `CCPUN_NEON_ENDPOINT_ID` and `CCPUN_NEON_DATABASE` variables are intentionally not used in UAT; unlike UAT, the gated Production lane requires all four as an additional exact-identity boundary.

The application re-verifies the runtime role, database, both migration checksums and stored resource identity before each manual sync. The first successful Meta sync after the provider-history migration follows cursor pagination for the complete history available to the authorized account. Later manual syncs use the previous success time minus a 14-day overlap; Instagram media is cursor-only, so it stops after the first page wholly older than the overlap window.

Provider-native Meta rows store provider IDs, account IDs, caption/text, media type, publication time, permalink, thumbnail reference and validated native counters. Content revisions and metric snapshots are inserted only when their hashes change. Exact provider object IDs may link to an existing Admin publication; text or timestamps never auto-link. Tokens, raw provider JSON and media binaries are never stored.

## UAT and rollback

After authenticated Preview login, open the Meta Connection page and press **Sync content และสถิติย้อนหลัง**. Then open `/snt-admin/distribution/analytics/` to inspect latest values and per-metric deltas. Read back `social_provider_content`, `social_provider_content_revision`, `social_provider_metric_snapshot`, `social_metric_snapshot`, `social_provider_sync_state` and matching `social_execution_audit` rows without displaying credentials. Confirm no provider upload/publish, cron or Production deployment occurred.

Rollback is configuration-only: remove or disable `CCPUN_SOCIAL_ANALYTICS_INGESTION_ENABLED` and `CCPUN_SOCIAL_DATABASE_URL` on this Preview branch, then redeploy Preview. Keep the additive UAT tables for audit and recovery; dropping them requires separate destructive approval.

## PR57 environment matrix

| Classification | Variable | Status |
| --- | --- | --- |
| Secret | `AUTH_SECRET` | Required existing Admin Auth.js secret; unique to this Preview lane |
| Secret | `AUTH_GOOGLE_SECRET` | Required existing Admin Google OAuth secret |
| Secret | `SANITY_API_READ_TOKEN` | Required existing server-only Sanity UAT read token |
| Secret | `SANITY_API_WRITE_TOKEN` | Required for owner-triggered create/update of Social Sanity Drafts; never browser-visible |
| Secret | `CCPUN_ADMIN_DATABASE_URL` | Required existing Admin operations connection using the restricted `ccpun_admin_runtime` UAT role |
| Secret | `CCPUN_SOCIAL_DATABASE_URL` | Required; exact `ccpun_social_runtime` UAT URL |
| Secret | `CCPUN_META_ACCESS_TOKEN` | Required for Meta reads; never exposed to the client |
| Config | `AUTH_URL` | Required exact Preview origin for Admin Auth.js and same-origin mutation checks |
| Config | `AUTH_GOOGLE_ID` | Required existing Admin Google OAuth client ID |
| Config | `CCPUN_ADMIN_OWNER_EMAILS` | Required verified Owner allowlist |
| Config | `CCPUN_APP_ENV` | Required; `admin-uat` only |
| Public config | `NEXT_PUBLIC_SANITY_PROJECT_ID` | Required; `ccb9lnw5` only |
| Public config | `NEXT_PUBLIC_SANITY_DATASET` | Required; `uat` only |
| Config | `CCPUN_SOCIAL_OPERATIONS_ENABLED` | Required master gate for the Social UI and human approval recording |
| Config | `CCPUN_SOCIAL_PROVIDER_READS_ENABLED` | Required independent provider-read kill switch |
| Config | `CCPUN_SOCIAL_ANALYTICS_INGESTION_ENABLED` | Required independent Neon-ingestion kill switch |
| Config | `CCPUN_SOCIAL_PROVIDER_WRITES_ENABLED` | Keep absent or `0`; reserved independent write kill switch until an executor is separately approved |
| Config | `CCPUN_META_GRAPH_VERSION` | Required; explicit approved Graph API version |
| Config | `CCPUN_META_GRANTED_SCOPES` | Required server-side scope attestation |
| Optional config | `CCPUN_META_PAGE_ID` | Set only when the token manages more than one Page |
| Public config | `NEXT_PUBLIC_CCPUN_GOOGLE_DRIVE_OAUTH_CLIENT_ID` | Required for owner-triggered Drive Picker, Instagram mobile handoff and Google Sheets export |
| Public config | `NEXT_PUBLIC_CCPUN_GOOGLE_DRIVE_PICKER_API_KEY` | Required for Drive Picker only; restrict the key to the exact Preview origin and Google Picker API |
| Public config | `NEXT_PUBLIC_CCPUN_GOOGLE_DRIVE_APP_ID` | Required numeric Google Cloud project number passed to `PickerBuilder.setAppId`; not the OAuth client ID |
| Config | `CCPUN_GOOGLE_DRIVE_ADMIN_ROOT_FOLDER_ID` | Required server-side approved Drive root; immutable folder ID, not a secret |
| Config | `CCPUN_GOOGLE_DRIVE_MEDIA_ROOT_FOLDER_ID` | Required server-side approved media root; immutable folder ID, not a secret |
| Remove from PR57 Preview only | `CCPUN_NEON_PROJECT_ID`, `CCPUN_NEON_BRANCH_ID`, `CCPUN_NEON_ENDPOINT_ID`, `CCPUN_NEON_DATABASE` | Duplicated by the UAT URL plus database identity row; all four are required in the gated Production lane |
| Remove from PR57 | `CCPUN_SOCIAL_PUBLICATION_APPROVAL_ENABLED` | Approval reuses `CCPUN_SOCIAL_OPERATIONS_ENABLED` and the owner/identity/migration gates |
| Remove from PR57 | `CCPUN_SOCIAL_DATA_MODE` | Current operations do not use a synthetic/live selector |
| Legacy only | `CCPUN_SOCIAL_ENABLED` | Retained only for the frozen Foundation branch; do not set on PR57 |
| Optional fallback | `NEXT_PUBLIC_CCPUN_VERCEL_PROJECT_ID` | Not needed when Vercel supplies `VERCEL_PROJECT_ID` |

Enable Google Drive API, Google Picker API and Google Sheets API in the same UAT Google Cloud project before browser UAT. Google access tokens remain memory-only and are never copied into Vercel, Sanity or Neon.

Drive Picker is available for Facebook and Instagram image, album/carousel, video and Reel authoring, but Instagram remains `native-finish` Mobile handoff only. The UI does not expose Instagram provider execution or Direct scheduling. For Reel UAT, the selected MP4 is accepted only when Google Drive REST metadata for the exact verified file supplies positive width, height and `durationMillis`, and height is greater than width. Google notes that video metadata may not be available immediately after upload; while any field is absent, the UI fails closed and asks the owner to retry after Drive finishes processing the video.
