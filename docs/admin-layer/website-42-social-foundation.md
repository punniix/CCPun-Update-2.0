# Website 4.2 Phase 1 — Social Foundation v2

Status: synthetic Admin UAT only. No real account, media upload, platform request, Sanity write, or Production mutation.

## Ownership

- Sanity UAT owns `masterContent`, the required `socialVariant.masterContent` parent reference, approved channel copy, Comment Series copy, publishing mode, and existing review metadata.
- Backlinks from Master Content to variants are derived from the required parent reference; no second editable relationship is stored.
- Postgres owns the operational variant link, publication state, provider object IDs, jobs, locks, idempotency, per-comment execution state, and execution audit.
- Credential/token storage and media storage are intentionally absent from Phase 1.

## Fail-closed UAT lane

The feature is available only when all of these match:

- `CCPUN_SOCIAL_ENABLED=1`
- `CCPUN_SOCIAL_DATA_MODE=synthetic`
- `CCPUN_APP_ENV=admin-uat`
- Vercel Project ID is the `ccpun-admin` survivor
- branch is `codex/website-42-social-foundation-v2-20260828`
- Sanity Project/Dataset is the approved UAT lane (`ccb9lnw5` / `uat`)

Any mismatch returns 404. `social:read` is owner-only in Phase 1. The read-only API additionally requires authenticated Admin identity and the exact configured Auth.js origin.

`masterContent` and `socialVariant` are visible only in an approved UAT Studio lane. UAT removes publish, unpublish, delete, and scheduled-publishing actions. Production Studio hides both types and exposes no document actions for them.

## Database readiness

The optional server-only secret name is `CCPUN_SOCIAL_DATABASE_URL`. The application never returns or logs its value, host, role, or raw provider error.

The readiness probe runs one bounded read-only HTTPS query through the official Neon serverless driver and returns only:

- `configured`
- `reachable`
- `migrationCurrent`
- sanitized `errorCategory`

The current migration is `db/migrations/20260828_website_42_social_foundation_v2.sql`. It uses an advisory transaction lock, a version/checksum ledger, and refuses to mark the migration current if pre-existing Social tables have unknown lineage.

## Manual Neon UAT handoff

Later, the COO must complete these external steps in the Neon/Vercel UI:

1. Confirm the exact Neon UAT project, branch, database, and role.
2. Confirm the v2 migration has never been applied; if any Social table already exists, stop for schema review.
3. Apply the reviewed v2 SQL in Neon SQL Editor.
4. Bind `CCPUN_SOCIAL_DATABASE_URL` as Sensitive to `ccpun-admin` Preview for the exact branch only.
5. Add the non-secret feature flags to that exact Preview branch only.
6. Redeploy the Preview and verify the readiness booleans. Do not paste the connection string into chat, shell commands, screenshots, Sanity, or source control.

## Rollback

Disable `CCPUN_SOCIAL_ENABLED`, remove the exact Preview-branch database binding, and redeploy the Preview. Do not drop the schema automatically. A schema drop requires separate destructive approval and prior export/review.
