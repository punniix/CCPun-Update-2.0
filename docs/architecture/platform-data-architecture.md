# CCPun Platform Data Architecture

Last read-only verification: 2026-08-30.

This document is the canonical repository map for runtime environments and data ownership. It records the current verified architecture, not a migration wish list. Project IDs and dataset names are contracts until a separately approved migration changes them.

## Mental model

```text
GitHub = code
Vercel = runtime and deployment
Sanity = editorial content, Draft/Published workflow and Article SEO fields
Neon Postgres = private Admin and social operational state
Google Drive = private strategy/research documents and long-lived media

Production = real system
UAT = isolated testing system
```

Code, content and operational state must not be mirrored across systems. Deployment context selects the environment; editors never select projects, datasets, databases or Production versus UAT.

## Current verified topology

| Surface | Current owner | Allowed data plane |
|---|---|---|
| Public Web Production | Vercel `ccpun-web`; `ccpun.com`, `www.ccpun.com` | Published reads from Sanity `kyfxgjnq/production` only |
| Admin Production | Vercel `ccpun-admin`; `admin.ccpun.com` | Authenticated/RBAC-guarded Sanity `kyfxgjnq/production` operations |
| Admin UAT/Preview | Vercel `ccpun-admin` Preview | Sanity `ccb9lnw5/uat` during its current private trial; UAT-only operational data |
| Local UAT | loopback `127.0.0.1:3100` | Sanity `ccb9lnw5/uat` during its current private trial; UAT-only operational data |
| Local Production Draft lane | loopback `127.0.0.1:3000` | Sanity `kyfxgjnq/production`; separately guarded Draft operations only |

Both Vercel projects build from the existing `punniix/CCPun-Update-4.0` repository. Do not create another repository or Vercel project to separate Web, Admin, Sanity or Neon.

Preview routing uses the feature branch name. Production ignored-build routing uses native Git changed-file evidence: an Admin-only Website 4.2 change builds `ccpun-admin` and skips `ccpun-web`, while a Web-only release does the inverse. Mixed changes, unknown paths, an empty diff, or unavailable Git evidence build both survivors. This fail-safe fallback must not be weakened to save a build.

## Sanity boundaries

The current two-project split is an intentional security boundary:

| Project | Dataset | Status | Purpose |
|---|---|---|---|
| `kyfxgjnq` | `production` | active | Published content and guarded Production editorial workflows |
| `kyfxgjnq` | `uat` | legacy, runtime denied | rollback evidence only |
| `ccb9lnw5` | `uat` | active, private trial | schema, authenticated Draft workflow and synthetic Preview testing |
| `ccb9lnw5` | `recovery` | active, private trial, non-routine | temporary recovery evidence pending protected export and verification |

Do not consolidate these projects until dataset-scoped user and robot permissions are verified to preserve or improve least privilege. A lower project count is not a valid reason to weaken the Production/UAT boundary.

The current private trial is a verified fact; the possible conversion of `ccb9lnw5/uat` to a public zero-cost dataset is pending and has not happened. Before the trial expires:

1. Inventory `uat` and keep it limited to synthetic records plus authenticated Drafts that are safe for the planned lane. Private strategy, research, credentials and Production restore material do not belong there.
2. Export any private or Production recovery material from `recovery`, record checksums, encrypt the local copy or place it in the Restricted area of the owner-selected `CCPun-Financial Advisor Project` Drive folder, and verify read-back.
3. Both private datasets revert to public visibility if the trial expires. Do not allow the trial to lapse while private material remains in `recovery`; the intended no-new-spend steady state keeps only `uat` as the active public test lane. Request separate deletion approval only after export and read-back pass; this document does not authorize deleting a dataset or document.

Private strategy and research documents use the owner-selected Google Drive folder as their source of truth. Its verified child folders include `Website 4.2 — Admin Control Plane` and the existing `Website 4.2 — Media Library`. These names record the current inventory only; authorization still requires the owner-selected immutable root/file IDs, which must not be hard-coded into public code or documentation. Sanity `internal` remains deferred; do not create or populate it merely to mirror Drive. Existing intelligence records require inventory and an approved migration before any move or deletion.

Production content types include `article`, `author` and `category`. Existing regulated review and compliance states remain product contracts; do not replace them with a shorter generic workflow without explicit approval. Do not add `siteSettings` or another document type until a real consumer requires it.

## Neon boundaries

Neon project `young-term-47483330` and its existing `main` branch currently belong to the UAT operational lane. The legacy branch name does not make it Production. Do not create a duplicate `uat` child branch, and do not relabel or treat `main` as Production without a read-only branch, database, schema, role, grant, migration-ledger and consumer inventory.

The existing `ccpun_social` schema owns social operational state such as publication records, jobs, provider IDs, locks, retries, sync state, audit metadata and idempotency. The separate `ccpun_admin` schema owns Control Plane `auditLog`, `researchSnapshot` and `seoSuggestion` workflow/state. Both schemas reference Sanity content by document identity/revision and neither owns article bodies, authors, categories or public SEO fields.

`ccpun_admin` is introduced by the checksum-locked migration `20260830_website_42_admin_operations_v1` (`sha256:51f16b563368488362408f323f95863ecf8f277b6b725b96189fedddf1300e4f`). Runtime access uses only the server-side `CCPUN_ADMIN_DATABASE_URL` as role `ccpun_admin_runtime`; it must never fall back to the social connection, owner/backfill connection or a Sanity write token. The role is created without login/superuser/create/inherit/replication/bypass capability, preserves a separately enabled login on safe migration reruns, and receives only explicit `ccpun_admin` table/column grants; all `ccpun_social` rights are revoked. Every repository operation verifies the live database, current role, persistent `system_identity` row and migration ledger before its query. Runtime is allowed only for `admin-uat` and `local-uat`.

`NOLOGIN` is the deliberate post-migration default. A human Neon owner must later enable `LOGIN` and issue a fresh password for this exact UAT role before configuring the Preview-only runtime URL; the migration/backfill owner URL is never reused. No Production runtime credential or branch is created by this cutover.

The UAT target is pinned to project `young-term-47483330`, branch `br-crimson-mouse-az7ajkv8`, compute `ep-mute-frost-aztvz394`, database `neondb`. Only the exact direct or pooled hostname of that compute is accepted. One-time schema/backfill uses the separate ephemeral `CCPUN_ADMIN_BACKFILL_DATABASE_URL` and accepts only `neondb_owner` or `cloud_admin`; it refuses the runtime role. `--apply` requires the exact cutover baseline (`43` audit, `2` research, `19` suggestions) and is not complete until the source and target deterministic lineage digests match.

Create a Production Neon branch only when an approved Production operational use case exists. Do not create a speculative worker, queue, database, schema or service.

## Runtime authority

`lib/admin/environment.ts` owns fail-closed environment, Vercel project, Sanity project and dataset matching. These currently meaningful lanes are:

| Environment | Meaning |
|---|---|
| `production` | public Web Production |
| `production-admin` | private Admin Production |
| `admin-uat` | Admin branch Preview/UAT |
| `local-production` | loopback Production Draft lane |
| `local-uat` | loopback UAT lane |
| `development` / `web-uat` | bounded development/test lanes |
| `lab` / `uat` | retained compatibility labels that must fail closed |

Do not bulk-rename environment variables or compatibility labels. Identify every repository, Vercel and script consumer before deprecating a name. Unknown or mismatched values must remain denied.

## Credential contract

- Public Web has no Sanity write credential, internal-dataset credential or social-provider write credential.
- Production and UAT credentials remain separate and scoped to their exact deployment lanes.
- Read operations require a read credential and fail closed when it is absent.
- A read credential must never fall back to a write credential.
- Credential values never appear in source, logs, commands, reports or documentation.
- No application may discover or select a higher-privilege credential automatically.

Live Vercel variable names, types, environments and branch scopes must be read back before any rename or deletion. This document records the contract, not secret values.

## Data ownership

| Data | Owner |
|---|---|
| Published and Draft editorial content | Sanity |
| Public SEO fields attached to content | Sanity |
| Private research snapshots, Control Plane audit and SEO suggestion lifecycle | Neon `ccpun_admin` |
| Private strategy and research documents | Google Drive folder `CCPun-Financial Advisor Project` |
| Long-lived media source files | Google Drive folder `CCPun-Financial Advisor Project` |
| Social copy and human approval state | Sanity |
| Publication execution, retries, provider IDs and sync cursors | Neon |
| Application code, schema source and migrations | GitHub |
| Deployment/runtime configuration | Vercel |

UAT must never write Production Sanity, Production Neon or real provider state. Code guards must enforce the boundary; naming and documentation alone are insufficient.

## Deprecated and temporary resources

| Resource | Direction | Retirement gate |
|---|---|---|
| `kyfxgjnq/uat` | retire eventually | export, reference/env/CORS/token/Studio inventory, rollback window and explicit deletion approval |
| legacy `articleV41`, `authorV41`, `categoryV41` documents | migrate or archive eventually | document/reference inventory, export and verified replacement |
| `lab` and `uat` environment labels | remove eventually | zero consumers plus retained fail-closed regression coverage |
| misleading Sanity display names | rename eventually | live consumer/read-back verification; immutable project IDs remain unchanged |

Nothing in this table authorizes deletion.

Legacy Sanity `auditLog`, `researchSnapshot` and `seoSuggestion` records remain rollback evidence after cutover. Runtime code must not create new records of those types. Deleting legacy records requires a later explicit approval after hash/count parity and a rollback window.

## Cross-store SEO apply

An approved SEO suggestion never patches Article content and Neon state optimistically in parallel. The server claims the exact Neon suggestion row/version and request ID, re-reads the Sanity Draft and approved base/revision, patches only the approved `seo.*` field with Sanity `ifRevisionId`, then finalizes Neon with the returned Article revision and sanitized audit. A Sanity result without a returned revision, a failed Neon finalization, or any other ambiguous outcome moves the suggestion to `reconciliation-required`; it is never retried automatically. Human reconciliation must compare the exact Article revision and field value before any later action.

## Change order

1. Record current mappings and verify the exact Production baseline.
2. Make the smallest code/documentation hardening change in a dedicated branch.
3. Pass architecture, TypeScript, security and protected-contract checks.
4. Inventory live Vercel, Sanity and Neon consumers before changing infrastructure.
5. Test any data migration in UAT with checksums and read-only postflight.
6. Verify Production and UAT independently.
7. Perform deletion, merge, Production deployment or provider activation only with exact current approval.

Until these gates pass, preserve the current two-project Sanity split and UAT-only Neon classification.
