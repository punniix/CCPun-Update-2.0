# CCPun Platform Live State — 2026-08-24

Status: Read-only reconciliation snapshot

This file records externally verified platform state used to plan the architecture migration. It is not an authorization to mutate Production.

## Vercel account

- Team: `punniixs-projects`
- Current plan observed: **Pro**

## Vercel projects

| Project | Project ID | Observed role | Domains / notes |
|---|---|---|---|
| `ccpun-web-v4-prod` | `prj_dxwjITkd0av5QiJQv2snUlIASUWu` | Public Web Production | `ccpun.com`, `www.ccpun.com`; Git-linked to `punniix/CCPun-Update-4.0` |
| `ccpun-admin-prod` | `prj_6tuUxJxYbQ4mpF7sMgNWx2p2jowN` | Private Production Admin | `admin.ccpun.com`; Production deployment observed READY |
| `ccpun-web-lab` | `prj_438M14AAob2nbf20q7Xa5L7A7aMo` | Admin/Intelligence Lab legacy lane | Vercel-only project URL; deployment history references `v4-1-admin-intelligence-lab` |
| `ccpun-web-v4-1-uat` | `prj_OR7AlGsE8spGahQegDvd0JudaiEg` | Admin/Analytics UAT legacy lane | Deployment history includes Admin Lab and analytics UAT work |
| `ccpun-web-v4-uat` | `prj_E3Z5RDozUgrbW625d6pE8aQdfQuK` | Older Website 4.0 UAT | No custom domain observed; deployment history references the older cloud-preview repository/branch path |

No project was renamed or deleted during this reconciliation.

## Public Web Production

Current source repository:

- Repository: `punniix/CCPun-Update-4.0`
- Default / Production branch: `v4-production`
- Current project package version in source: `4.0.0`

Current source also contains later 4.1-era Admin/Intelligence terminology. This is documented as **version drift**; package/release versioning must be normalized separately rather than inferred from project names or README headings.

## Production Admin live state

Read-only verification on 2026-08-24 observed:

- `https://admin.ccpun.com/` responds successfully and routes to the CCPun Control Plane login.
- The surface is marked noindex/nofollow.
- The rendered runtime identifies itself as the Production Admin lane.
- The runtime references Sanity Production `kyfxgjnq/production`.

Therefore older documentation that describes `ccpun-admin-prod` as paused/inactive is stale and must not be treated as the current runtime fact.

This observation does not prove every authenticated Admin action or Production mutation permission. Those remain subject to focused security and RBAC verification.

## Sanity trust domains from the active architecture contract

### Production

- Project: `kyfxgjnq`
- Dataset: `production`

### Non-Production

- Project: `ccb9lnw5`
- Dataset: `uat`

The current repository architecture explicitly separates these trust domains. Lab/UAT must not silently fall back to Production.

## GitHub branch state relevant to migration

Observed branches include:

- `v4-production`
- `uat`
- `main`
- feature/fix/SEO/performance/release/chore branches

The production branch remains `v4-production` during the architecture migration. Renaming it is deferred until Vercel, CI, and release dependencies are explicitly migrated.

## Confirmed documentation drift

The following drift is known at this snapshot:

1. `package.json` says `4.0.0` while current docs/workstreams use 4.1-era labels.
2. Some Admin architecture text still says the Production Admin project is paused/inactive, while the live Vercel project now serves `admin.ccpun.com` and has a READY Production deployment.
3. Existing Vercel project names encode versions/stages that no longer match the intended steady-state architecture.

The migration should correct these deliberately, not by renaming live resources first.

## Safety conclusion

The next safe step after this snapshot is a **guard and policy refactor on a non-Production branch**. It should add explicit Project-ID + application-lane + Sanity project/dataset invariants while retaining transitional compatibility with the existing Lab/UAT projects.

No DNS, domain, Production content, analytics, consent, or Vercel project mutation was performed to create this snapshot.
