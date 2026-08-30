# CCPun Platform Data Architecture

Last read-only verification: 2026-08-30.

This document is the canonical repository map for runtime environments and data ownership. It records the current verified architecture, not a migration wish list. Project IDs and dataset names are contracts until a separately approved migration changes them.

## Mental model

```text
GitHub = code
Vercel = runtime and deployment
Sanity = editorial content and approved intelligence records
Neon Postgres = operational state

Production = real system
UAT = isolated testing system
```

Code, content and operational state must not be mirrored across systems. Deployment context selects the environment; editors never select projects, datasets, databases or Production versus UAT.

## Current verified topology

| Surface | Current owner | Allowed data plane |
|---|---|---|
| Public Web Production | Vercel `ccpun-web`; `ccpun.com`, `www.ccpun.com` | Published reads from Sanity `kyfxgjnq/production` only |
| Admin Production | Vercel `ccpun-admin`; `admin.ccpun.com` | Authenticated/RBAC-guarded Sanity `kyfxgjnq/production` operations |
| Admin UAT/Preview | Vercel `ccpun-admin` Preview | Sanity `ccb9lnw5/uat`; UAT-only operational data |
| Local UAT | loopback `127.0.0.1:3100` | Sanity `ccb9lnw5/uat`; UAT-only operational data |
| Local Production Draft lane | loopback `127.0.0.1:3000` | Sanity `kyfxgjnq/production`; separately guarded Draft operations only |

Both Vercel projects build from the existing `punniix/CCPun-Update-4.0` repository. Do not create another repository or Vercel project to separate Web, Admin, Sanity or Neon.

## Sanity boundaries

The current two-project split is an intentional security boundary:

| Project | Dataset | Status | Purpose |
|---|---|---|---|
| `kyfxgjnq` | `production` | active | Published content and guarded Production editorial workflows |
| `kyfxgjnq` | `uat` | legacy, runtime denied | rollback evidence only |
| `ccb9lnw5` | `uat` | active | schema, Studio, content workflow and Preview testing |
| `ccb9lnw5` | `recovery` | active, non-routine | restore drills and disaster recovery only |

Do not consolidate these projects until dataset-scoped user and robot permissions are verified to preserve or improve least privilege. A lower project count is not a valid reason to weaken the Production/UAT boundary.

Editorial and Admin-intelligence schema sources are distinct ownership domains even where current schema aggregation or historical data still places them in one dataset. Moving intelligence records requires inventory, export, reference verification, target permission verification, copy-and-compare, cutover and separate deletion approval.

Production content types include `article`, `author` and `category`. Existing regulated review and compliance states remain product contracts; do not replace them with a shorter generic workflow without explicit approval. Do not add `siteSettings` or another document type until a real consumer requires it.

## Neon boundaries

Neon project `young-term-47483330` currently belongs to the UAT operational lane. Its existing `main` branch must not be relabelled or treated as Production without a read-only branch, database, schema, role, grant, migration-ledger and consumer inventory.

The existing `ccpun_social` schema owns social operational state such as publication records, jobs, provider IDs, locks, retries, sync state, audit metadata and idempotency. It references Sanity content by document identity and editorial revision; it does not own article bodies, authors, categories or public SEO content.

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
| Private research and intelligence records | private Sanity boundary after permission verification |
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

## Change order

1. Record current mappings and verify the exact Production baseline.
2. Make the smallest code/documentation hardening change in a dedicated branch.
3. Pass architecture, TypeScript, security and protected-contract checks.
4. Inventory live Vercel, Sanity and Neon consumers before changing infrastructure.
5. Test any data migration in UAT with checksums and read-only postflight.
6. Verify Production and UAT independently.
7. Perform deletion, merge, Production deployment or provider activation only with exact current approval.

Until these gates pass, preserve the current two-project Sanity split and UAT-only Neon classification.
