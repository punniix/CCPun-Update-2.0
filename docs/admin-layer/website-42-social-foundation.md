# Website 4.2 Phase 1 — Social Foundation v2

Status: synthetic Admin UAT only. No real account, media upload, platform request, Sanity write, or Production mutation.

## Ownership

- Sanity UAT owns `masterContent`, the required `socialVariant.masterContent` parent reference, approved channel copy, Comment Series copy, publishing mode, and existing review metadata.
- Backlinks from Master Content to variants are derived from the required parent reference; no second editable relationship is stored.
- Postgres owns the operational variant link, publication state, provider object IDs, jobs, locks, idempotency, per-comment execution state, and execution audit.
- Phase 1 defines reusable media metadata and variant-to-media references, but stores no media bytes, provider upload state, storage URL, or storage credential.
- Credential/token storage remains intentionally absent from Phase 1.
- New variants select a main format (`text-post`, single image, album, carousel, Reel, video, Short, photo post, or Live). Facebook Comment Series remains an optional child of a Facebook main post, not a selectable main format. The legacy `comment-series` value remains read-compatible during UAT cleanup.

Format meanings are intentionally distinct: `image-post` is one image, `album` is a Facebook multi-image post, `carousel` is an ordered multi-card asset, and `photo-post` is TikTok's photo format. `live` represents the platform Live object and post-Live reporting, not real-time polling.

## Fail-closed UAT lane

The feature is available only when all of these match:

- `CCPUN_SOCIAL_ENABLED=1`
- `CCPUN_SOCIAL_DATA_MODE=synthetic`
- `CCPUN_APP_ENV=admin-uat`
- Vercel Project ID is the `ccpun-admin` survivor
- branch is `codex/website-42-social-media-integration-20260829`
- Sanity Project/Dataset is the approved UAT lane (`ccb9lnw5` / `uat`)

Any mismatch returns 404. `social:read` is owner-only in Phase 1. The read-only API additionally requires authenticated Admin identity and the exact configured Auth.js origin.

`masterContent` and `socialVariant` are visible only in an approved UAT Studio lane. UAT removes publish, unpublish, delete, and scheduled-publishing actions. Production Studio hides both types and exposes no document actions for them.

## Database readiness

The optional server-only secret name is `CCPUN_SOCIAL_DATABASE_URL`. The application never returns or logs its value, host, role, or raw provider error.

The readiness probe runs one bounded read-only HTTPS query through the official Neon serverless driver. It requires both the frozen ledger checksum and every required operational table, including `social_media_asset`, while returning only:

- `configured`
- `reachable`
- `migrationCurrent`
- sanitized `errorCategory`

The current migration is `db/migrations/20260828_website_42_social_foundation_v2.sql`. It uses an advisory transaction lock, a version/checksum ledger, and refuses to mark the migration current if pre-existing Social tables have unknown lineage.

The applied v2 database constraint predates `album` and `live`. The additive, backward-compatible migration is `db/migrations/20260829_website_42_social_post_formats.sql`; it preserves the legacy `comment-series` value and does not rewrite rows. Until that migration is separately approved and applied to UAT, readiness fails closed and no operational write lane may store the new formats.

## Manual Neon UAT handoff

The frozen v2 foundation ledger was previously verified in Neon UAT. Re-verify it before applying the post-format migration; do not assume the earlier screenshot is current.

1. Sign in to Neon manually and select the exact UAT project/branch/database.
2. Use the migration-owner role only inside Neon SQL Editor. Never bind it to Vercel.
3. Run this read-only preflight:

```sql
SELECT version, checksum
FROM ccpun_social.schema_migration
WHERE version IN (
  '20260828_website_42_social_foundation_v2',
  '20260829_website_42_social_post_formats'
)
ORDER BY version;

SELECT format, count(*)
FROM ccpun_social.social_variant_link
GROUP BY format
ORDER BY format;
```

4. Continue only when the v2 row equals `sha256:b6ad0b823775df1dcfc06e0da896dfcc477cfbeae897b70e228c18a051712acb`. If the post-format row exists with any checksum other than `sha256:64d8471247fa28a08fcb99cda5b4df87e73f7ed1dc497250da26d01119ade977`, stop.
5. Apply the complete reviewed file `db/migrations/20260829_website_42_social_post_formats.sql` as one transaction. Do not copy only the `ALTER TABLE` lines.
6. Run this read-only postflight:

```sql
SELECT version, checksum, applied_at
FROM ccpun_social.schema_migration
WHERE version = '20260829_website_42_social_post_formats';

SELECT pg_get_constraintdef(c.oid) AS format_constraint
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'ccpun_social'
  AND t.relname = 'social_variant_link'
  AND c.conname = 'social_variant_link_format_check';
```

7. The result must contain the frozen checksum and all ten current values plus legacy `comment-series`: `text-post`, `image-post`, `album`, `carousel`, `comment-series`, `reel`, `video`, `short`, `photo-post`, and `live`.
8. Keep the existing least-privilege Preview runtime role read-only. Do not grant it migration ownership or provider-write privileges.
9. Bind only that runtime connection in `CCPUN_SOCIAL_DATABASE_URL` as Sensitive to `ccpun-admin` Preview for the exact integration branch.
10. Redeploy only after variable names/types/scopes and the exact branch pass read-back. Never paste a connection string into chat, shell commands, screenshots, Sanity, or source control.

## Threaded Comment Series readiness

The Phase 1 database prevents self-parenting and cross-publication parent links. The server-side planner additionally rejects duplicate IDs/order values, missing parents, longer cycles such as A → B → C → A, invalid top-level/threaded relationships, unpublished parents, and comments that have not passed human review. Its regression test covers the bounded cycle path.

Provider execution remains disabled. A real executor still requires an approved Meta connection, per-comment idempotent writes, retry/audit persistence, and authenticated UAT verification before any comment is sent.

## Rollback

Disable `CCPUN_SOCIAL_ENABLED`, remove the exact Preview-branch database binding, and redeploy the Preview. Do not drop the schema automatically. A schema drop requires separate destructive approval and prior export/review.
