# CCPun Admin & Intelligence Layer — Environment Boundary

Date: 2026-08-22
Status: Active architecture decision

## Core Decision

Separate the public website runtime from the private editorial/Admin working surface.

### Public Production Website

Vercel project:
- `ccpun-web-v4-prod`

Public domains:
- `ccpun.com`
- `www.ccpun.com`

Sanity dataset:
- `production`

Behavior:
- public website reads only Published content
- no public Sanity Studio
- no public editorial Admin surface
- Draft/Preview/Admin tooling is not exposed as normal public website functionality

### Private Production Editorial/Admin Tool

Purpose:
- real CCPun content operations
- create Drafts
- edit Drafts
- SEO metadata work
- review proposals
- preview real content
- human approval
- human Publish

Sanity dataset:
- `production`

Target Vercel project:
- `ccpun-admin-prod` (`prj_6tuUxJxYbQ4mpF7sMgNWx2p2jowN`) — created and currently paused; not an active owner surface

Target owner entry:
- `https://admin.ccpun.com/` → `/snt-admin/`
- `https://admin.ccpun.com/studio/` for private Draft Preview and Human Publish

Access rule:
- private/protected working surface only
- one verified Google/Auth.js login, followed by server-side RBAC and policy checks
- no public indexing
- not a customer-facing route or public CMS
- separate Vercel project, credentials and deployment from `ccpun-web-v4-prod`
- public website routes are not exposed as an unauthenticated second website on the Admin host

Production workflow:
`Draft -> Review -> Preview -> Human approval -> Human Publish`

### Non-Production Feature Development

Use for developing and validating backend/Admin features.

Surfaces:
- `ccpun-web-lab` — major feature/architecture development
- `ccpun-web-v4-1-uat` — integration, QA, release-candidate validation

Sanity dataset:
- `uat`

Allowed:
- schema experiments
- Admin UI development
- SEO engine development
- research provider integration
- review workflow development
- AI proposal testing
- test Draft mutations in `uat`
- synthetic/test content

Not allowed:
- publish real CCPun production articles
- mutate `production` dataset
- production canonical/redirect/noindex changes
- production DNS/config/deploy

Promotion flow:
`Lab -> UAT -> Private Production Editorial/Admin Tool at admin.ccpun.com`

The public Production website consumes only the Published result from the `production` dataset.

## Human / AI Permission Boundary

AI may:
- research
- analyze
- audit
- summarize
- generate proposals
- generate Draft content

AI may not:
- approve itself
- publish
- delete content
- change canonical
- change redirects
- change noindex
- change production configuration
- deploy production
- change DNS

## Sanity Dataset Mapping

| Runtime / Surface | Dataset | Purpose |
|---|---|---|
| Local Mac `npm run local:uat` at `localhost:3100` | `ccb9lnw5/uat` | Full synthetic Draft/SEO/review/preview workflow isolated from Local Production |
| Local Mac `CCPun Admin.app` | `kyfxgjnq/production` | Owner-authenticated Draft work on loopback only; CORS exists only while the local runtime is active |
| `ccpun-web-lab` | `uat` | Major Admin/backend feature development |
| `ccpun-web-v4-1-uat` | `uat` | Integration / QA / release candidate |
| future `admin.ccpun.com` / paused `ccpun-admin-prod` | `production` | Intended real Draft → Review → Preview → Human Publish workflow; credentials and data access are not active |
| `ccpun-web-v4-prod` public website | `production` Published perspective only | Public website rendering |

The `uat` dataset is private and uses test/seed content. The current Sanity plan does not include advanced native dataset-copy management, so production is not automatically cloned into UAT.

## Production Content Completeness Contract

The private Production Admin reads the existing Sanity `production` dataset directly. It does not copy Published/Draft articles into another CMS and it never imports UAT seed documents into Production.

Before enabling editing, a read-only reconciliation must group raw Article documents by normalized base ID and prove that each logical article appears once in one of these states:

- `Published` — published document exists and no Draft overlay exists
- `Published + Draft changes` — both the published document and `drafts.<id>` exist
- `Draft only` — only `drafts.<id>` exists

The reconciliation must use the complete paginated result set and report orphan Drafts, duplicate slugs, broken category/author/image references and count mismatches. It must not repair, rewrite, publish or delete during inventory.

Owner editing uses the exact existing Sanity document identity. An `แก้ไขบทความ` action opens the private Studio document; changes to an already Published article are saved as its Draft overlay so the public Published document remains unchanged until Human Publish. Full content editing remains in Sanity Studio; the Control Plane remains the operating/review layer rather than a second unrestricted CMS.

## Current Enforced Code Boundary

One shared invariant now governs Admin clients, public Sanity reads, Sanity Live, CLI and Studio:

| Application lane | Allowed dataset | Admin capability |
|---|---|---|
| `local-uat` | `ccb9lnw5/uat` only | Local test Draft operations; exact `localhost:3100` host only, bound to loopback `127.0.0.1` |
| `local-production` | `kyfxgjnq/production` only | Owner-authenticated Production Draft operations on loopback; Publish/Delete remain human-gated or hard denied as defined by policy |
| `development`, `lab`, `uat` | `uat` only | UAT Draft operations |
| `production-admin` | `production` only | Whitelisted real Draft operations; Control Plane publish/delete remain denied |
| public `production` | `production` Published perspective only | Admin and Studio unavailable |
| missing, unknown or mismatch | none | Fail closed |

Changing only `NEXT_PUBLIC_SANITY_DATASET`, project ID or `CCPUN_APP_ENV` is not enough to cross lanes. `local-uat` accepts only the exact Non-Production project/dataset and host `localhost:3100`, while `local-production` accepts only `localhost:3000`; both servers listen only on loopback `127.0.0.1`. They use separate Auth.js cookie namespaces and separate Next.js build directories so they can run concurrently without sharing browser or compiler state. A request using the other lane's Host/port returns `404`. `production-admin` also requires the current Vercel `VERCEL_PROJECT_ID` to exactly match the configured `CCPUN_PRODUCTION_ADMIN_VERCEL_PROJECT_ID`; missing or mismatched identity disables Admin clients, Draft mutations and Studio. Public `production` returns 404 for `/snt-admin`, Admin APIs, `/studio` and Draft Preview routes. The dedicated Production Admin project exists, but it is paused and has no Production credential/data access; no Admin domain or content operation is active.

Local UAT remains the feature-development lane. The separately approved `local-production` Draft lane starts through the single `CCPun Admin.app`, binds Next.js to `127.0.0.1`, serves only `localhost:3000`, requires Google/Auth.js plus the owner allowlist and pins Sanity to `kyfxgjnq/production`. The app adds only `http://localhost:3000` as a credentials-enabled Sanity CORS origin, verifies it before starting, records the owned process and removes the origin through `ปิดระบบ` or `ออกและปิดระบบ`. An occupied port, unverifiable CORS or non-loopback listener fails closed. Public Production, Vercel and DNS remain untouched.

### A2 runtime safety stop

`ccpun-admin-prod` was created from UAT-verified source and bound to its exact Project ID. Vercel Standard Protection protects generated deployment URLs and Previews, but the current plan rejected `All Deployments` protection for Production domains. Because the short Production alias was otherwise publicly reachable, the project is paused and returns `503 DEPLOYMENT_PAUSED`.

This is intentionally **not** an accepted Production Admin runtime. The A2 xhigh review selected a single Google/Auth.js login plus application and data-plane controls instead of duplicating Vercel/Cloudflare identity prompts. The project stays paused until the Vercel workspace is moved from Hobby to a commercial plan and A3 credentials/RBAC are explicitly approved and verified. The public `ccpun-web-v4-prod`, its domains and Sanity Production content remain untouched.

### A2 xhigh perimeter decision

The Production Admin does not require Vercel `All Deployments` or Cloudflare Access in its first owner-only release. Both would add another identity prompt; Vercel also prices private Production deployments as an Advanced Deployment Protection feature, while Cloudflare requires a new DNS/JWT-validation operating surface.

Instead, the known Admin hosts are matched across all application paths. The only pre-login paths are the Auth.js endpoints, login page bootstrap, `robots.txt` and required framework assets. All other unauthenticated pages redirect to the CCPun login and unauthenticated APIs return `401`. The request origin must exactly equal `AUTH_URL`; a mismatch returns `404`. Public `ccpun.com` remains outside this host-scoped perimeter, while generated deployment URLs keep Vercel Standard Protection.

This remains defense-in-depth without duplicate login screens:

1. Google/Auth.js verifies an allowlisted human once; Production accounts must use Google 2-Step Verification.
2. Server RBAC and hard-deny policy authorize each operation independently of the page guard.
3. Exact Vercel Project ID, application lane and Sanity project/dataset binding fail closed.
4. Least-privilege Sanity credentials, revision checks, atomic audit records and Human Publish contain the remaining blast radius.

Live read-back found that the current Vercel workspace is `Hobby`. Vercel documents Hobby as personal/non-commercial only, so a Pro plan correction is a blocking commercial/platform gate before activation. No plan purchase was made in A2.

The A0 register and approved remediation are recorded in [`a0-production-content-inventory.md`](./a0-production-content-inventory.md). After a verified full backup and revision-guarded transaction, the three UAT-only Draft documents are absent. The final count is 39 logical Articles, duplicate slug groups are zero and the A0 acceptance gate passes. Draft-only supporting references and missing featured images remain explicit per-Article publish checks.

Studio and Draft Preview routes use the same Auth.js allowlist as the Control Plane. Studio additionally requires the current owner-level `draft:apply` permission. Local Production permits native Article creation/editing, Human Publish, Unpublish and scheduled Drafts for the authenticated owner only. Permanent Delete is hidden while a Published version exists, so a live Article must be Unpublished before its remaining Draft can be deleted. UAT keeps these actions disabled; the future Cloud Production Admin retains its narrower action set until a separate promotion review. This action filter is defense-in-depth, not a substitute for least-privilege Sanity membership and recoverable backups.

The audit authority is intentionally split until a stronger provider integration is approved: `/snt-admin/audit` records Control Plane mutations with request IDs, while direct Studio Draft edits and Human Publish rely on Sanity History. Before Production Admin, verify Sanity History retention and least-privilege access, document administrator-email retention, and give the owner an explicit path to both histories. Do not claim the Control Plane log alone covers Studio actions.

### A1 threat controls

| Failure mode | Enforced control |
|---|---|
| Dataset changed to `production` in Lab/UAT | Lane/dataset mismatch fails closed |
| Public Production relabeled as `production-admin` | Current Vercel Project ID must also match the dedicated configured Admin Project ID |
| Missing Vercel system identity | Production Admin data plane and Studio stay disabled |
| Public user probes private routes | Public `production` returns 404 before Admin routing |
| AI/system attempts approval, Apply, Publish or Delete | Policy hard deny; whitelisted Draft mutation remains human-only |
| Proposal or target changes after review | Frozen approval fields, current-value/revision checks and atomic transaction reject stale work |
| Control Plane mutation succeeds without trace | Server request ID and audit document commit in the same transaction |
| Human publishes in Studio | Separate Sanity-authenticated Human Publish action; Sanity History is the audit source |

## Sanity Project Isolation

The approved project split is active:

| Sanity project | Dataset | Allowed consumers |
|---|---|---|
| `kyfxgjnq` — Production | `production` | `ccpun-web-v4-prod` and the future private Production editorial workflow only |
| `ccb9lnw5` — Non-Production | `uat` | `ccpun-web-lab` Preview and `ccpun-web-v4-1-uat` Preview only |

Lab and UAT use Sensitive read/write tokens issued for the Non-Production project; they intentionally share the same `uat` trust domain and never reuse Production credentials. The UAT export was copied into `ccb9lnw5/uat`; the old `kyfxgjnq/uat` dataset remains temporarily as rollback evidence and is not an allowed runtime target. The empty default `ccb9lnw5/production` dataset was removed after verifying that it contained no user documents. Do not add automatic Production fallback or automatic dataset copying.

## Local-First Provider Promotion Gates

Ubersuggest, deterministic SEO/GEO and the Growth Dashboard may proceed through the Local Mac-first architecture without Vercel Pro or `admin.ccpun.com`, but only after these safety gates:

1. Lab foundation and authenticated workflow QA pass.
2. The same commit passes `ccpun-web-v4-1-uat` with Sanity `uat`.
3. The `local-production → kyfxgjnq/production` invariant and public-Production deny path have focused tests.
4. The Local Production lane binds only to loopback, exact Google/Auth.js owner identity and `kyfxgjnq/production`; public Production and mismatched hosts fail closed.
5. U1 runs first against `ccb9lnw5/uat` with provider scope, quota, validation, freshness, idempotency and atomic audit evidence.
6. U2 may write normalized research/audit snapshots to `kyfxgjnq/production` only through a separately approved least-privilege persistence boundary; it never reuses UAT credentials or enables Publish.
7. GEO and dashboard reads use the accepted Local connector boundaries and remain human-reviewed.
8. The owner performs any real Publish separately after Preview and final adversarial security acceptance.

## Deferred Cloud Promotion

The approved A2 batches created and paused `ccpun-admin-prod`, selected the single-login perimeter and hardened Lab source. The A2–A7 cloud checklist remains available when the owner wants always-on or multi-device access, but it is not a dependency for Local U1–U2, GEO or the Growth Dashboard. It does not authorize a paid plan, DNS/domain change, Production credentials, Production Draft mutation or publication. Each remaining external step still requires explicit approval and read-back.

## Important Rules

1. A feature is never developed directly against the `production` dataset.
2. Production editorial tooling is private and never treated as a public CMS surface.
3. The public `ccpun.com` runtime reads Published content only.
4. Draft/Preview/Admin access remains authenticated and noindex.
5. Human publishing remains a separate approval action even after an Admin feature has been promoted from UAT.
6. Every Production Published/Draft Article must be reconciled and visible before owner handoff; UAT documents must never appear in the Production Admin.
