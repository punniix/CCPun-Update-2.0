# Social Analytics Ingestion UAT

This stacked lane adds owner-triggered TikTok historical metric snapshots to the existing Neon UAT resource. It does not create infrastructure, store provider tokens, poll in the background, or call a provider write endpoint. Meta/Instagram Insights remain deferred because their additional read scopes have not been approved.

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
- TikTok read credential remains server-only with `CCPUN_TIKTOK_GRANTED_SCOPES=user.info.basic,video.list`

The existing Admin Auth variables remain required. Never bind this lane to `Production`, `v4-production`, `admin.ccpun.com`, or `ccpun-web`.

## Exact Neon UAT lane

- Project: `young-term-47483330`
- Existing branch ID: `br-crimson-mouse-az7ajkv8`
- Existing compute: `ep-mute-frost-aztvz394`
- Database: `neondb`
- Runtime role: `ccpun_social_runtime`

Apply the complete `db/migrations/20260831_website_42_social_analytics_ingestion.sql` in Neon SQL Editor using the existing UAT owner role only after the three prerequisite ledger rows match their frozen checksums. Do not apply it to any other project, branch, endpoint or database. Then run the complete `db/migrations/20260831_website_42_social_analytics_ingestion_readback.sql`; every returned boolean must be `t`.

Bind these values to the exact Preview branch only:

- `CCPUN_NEON_PROJECT_ID=young-term-47483330`
- `CCPUN_NEON_BRANCH_ID=br-crimson-mouse-az7ajkv8`
- `CCPUN_NEON_ENDPOINT_ID=ep-mute-frost-aztvz394`
- `CCPUN_NEON_DATABASE=neondb`
- `CCPUN_SOCIAL_DATABASE_URL` — Sensitive connection for `ccpun_social_runtime`, never an owner role

The application re-verifies the runtime role, database, migration checksum and stored resource identity before each manual sync. It stores only exact-ID matched metrics, the TikTok provider account ID, cursor, sanitized sync state and execution audit. Unmatched video IDs remain visible in the response and are not inserted.

## UAT and rollback

After authenticated Preview login, open `/snt-admin/distribution/connections/tiktok/` and press **Sync และบันทึกสถิติย้อนหลัง**. Read back `social_metric_snapshot`, `social_provider_sync_state` and the matching `social_execution_audit` row without displaying credentials. Confirm no provider POST/upload/publish, cron or Production deployment occurred.

Rollback is configuration-only: remove or disable `CCPUN_SOCIAL_ANALYTICS_INGESTION_ENABLED` and `CCPUN_SOCIAL_DATABASE_URL` on this Preview branch, then redeploy Preview. Keep the additive UAT tables for audit and recovery; dropping them requires separate destructive approval.
