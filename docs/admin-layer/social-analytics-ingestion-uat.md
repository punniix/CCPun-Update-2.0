# Social Analytics Ingestion UAT

This stacked lane adds owner-triggered Meta/Instagram, YouTube and TikTok historical metric snapshots to the existing Neon UAT resource. Meta also stores a separate provider-native content registry for downstream analysis without pretending imported posts belong to the Admin publishing lifecycle. It does not create infrastructure, store provider tokens or raw provider payloads, poll in the background, or call a provider write endpoint. Deep Meta reach and YouTube watch-time remain deferred until their additional read scopes are approved.

## Exact Preview lane

- Vercel project: `ccpun-admin`
- Environment: Preview only
- Branch: `codex/website-42-social-analytics-ingestion-20260831`
- `CCPUN_APP_ENV=admin-uat`
- `NEXT_PUBLIC_SANITY_PROJECT_ID=ccb9lnw5`
- `NEXT_PUBLIC_SANITY_DATASET=uat`
- `CCPUN_SOCIAL_OPERATIONS_ENABLED=1`
- `CCPUN_SOCIAL_DATA_MODE=synthetic`
- `CCPUN_SOCIAL_PROVIDER_READS_ENABLED=1`
- `CCPUN_SOCIAL_ANALYTICS_INGESTION_ENABLED=1`
- Provider credentials remain server-only and use only the exact read scope sets documented in `social-provider-readonly-uat.md`

The existing Admin Auth variables remain required. Never bind this lane to `Production`, `v4-production`, `admin.ccpun.com`, or `ccpun-web`.

## Exact Neon UAT lane

- Project: `young-term-47483330`
- Existing branch ID: `br-crimson-mouse-az7ajkv8`
- Existing compute: `ep-mute-frost-aztvz394`
- Database: `neondb`
- Runtime role: `ccpun_social_runtime`

Apply the complete `db/migrations/20260831_website_42_social_analytics_ingestion.sql` and then `db/migrations/20260901_website_42_social_provider_native_history.sql` in Neon SQL Editor using the existing UAT owner role only after each migration's prerequisite ledger rows match their frozen checksums. Do not apply them to any other project, branch, endpoint or database. Then run the matching `*_readback.sql` files; every returned boolean must be `t`.

Bind these values to the exact Preview branch only:

- `CCPUN_NEON_PROJECT_ID=young-term-47483330`
- `CCPUN_NEON_BRANCH_ID=br-crimson-mouse-az7ajkv8`
- `CCPUN_NEON_ENDPOINT_ID=ep-mute-frost-aztvz394`
- `CCPUN_NEON_DATABASE=neondb`
- `CCPUN_SOCIAL_DATABASE_URL` — Sensitive connection for `ccpun_social_runtime`, never an owner role

The application re-verifies the runtime role, database, both migration checksums and stored resource identity before each manual sync. The first successful Meta sync after the provider-history migration follows cursor pagination for the complete history available to the authorized account. Later manual syncs use the previous success time minus a 14-day overlap; Instagram media is cursor-only, so it stops after the first page wholly older than the overlap window.

Provider-native Meta rows store provider IDs, account IDs, caption/text, media type, publication time, permalink, thumbnail reference and validated native counters. Content revisions and metric snapshots are inserted only when their hashes change. Exact provider object IDs may link to an existing Admin publication; text or timestamps never auto-link. Tokens, raw provider JSON and media binaries are never stored.

## UAT and rollback

After authenticated Preview login, open the Meta Connection page and press **Sync content และสถิติย้อนหลัง**. Then open `/snt-admin/distribution/analytics/` to inspect latest values and per-metric deltas. Read back `social_provider_content`, `social_provider_content_revision`, `social_provider_metric_snapshot`, `social_metric_snapshot`, `social_provider_sync_state` and matching `social_execution_audit` rows without displaying credentials. Confirm no provider upload/publish, cron or Production deployment occurred.

Rollback is configuration-only: remove or disable `CCPUN_SOCIAL_ANALYTICS_INGESTION_ENABLED` and `CCPUN_SOCIAL_DATABASE_URL` on this Preview branch, then redeploy Preview. Keep the additive UAT tables for audit and recovery; dropping them requires separate destructive approval.
