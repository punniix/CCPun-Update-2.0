# CCPun Website 4.1 — Production Web + Private Admin

This repository is the source of truth for the CCPun Next.js application stack.

## Production reality

- Public website: `https://ccpun.com`
- Public Vercel project: `ccpun-web-v4-prod`
- Production source branch: `v4-production`
- Private Admin: `https://admin.ccpun.com`
- Admin Vercel project: `ccpun-admin-prod`
- Sanity Production: `kyfxgjnq/production`
- Sanity Non-Production/UAT: `ccb9lnw5/uat`

**Important:** merging or pushing to `v4-production` can deploy the public Production website. Treat that branch as a Production control surface.

The exact current Cloud Admin deployment `dpl_FNgkY5UC86pmnJKPPDi7nVFLMjf8` was deployed from a CLI-only commit (`291d0983e67d70a44f9170273cd74f432a9055d7`) that is not yet recoverable from GitHub. Do not overwrite or treat that Admin deployment as source-controlled until the original working tree is pushed into GitHub.

Authoritative cross-system policy: `docs/architecture/platform-governance-20260824.md`.

## Branch model

- `feature/*`, `fix/*`, `chore/*` — scoped work
- `uat` — integration/UAT branch
- `v4-production` — public Production branch
- `main` — legacy branch; do not merge blindly into Production

Normal release flow:

`work branch -> PR to uat -> CI -> Preview/UAT verification -> PR uat to v4-production -> human release approval -> Production`

Routine local `vercel --prod` deployment from an unpushed commit is prohibited.

## Runtime

- Next.js 16.3 / App Router
- React 19
- Tailwind CSS v4
- Sanity 5 / `next-sanity`
- Auth.js with Google OAuth and email allowlists
- Node 22 is the consolidation/parity target for Public Web and UAT

Node 24 is a separate future upgrade and must not be bundled with environment consolidation or SEO URL migration.

## Vercel topology

Target steady state is **2 projects**:

1. Public Web — `ccpun-web-v4-prod`
   - Production: `ccpun.com`, `www.ccpun.com`
   - GitHub source: `v4-production`
   - UAT/Preview should use the same source lineage with isolated non-production data.

2. Private Admin — `ccpun-admin-prod`
   - Production: `admin.ccpun.com`
   - remains separate from Public Web;
   - may read/write only the explicitly approved Production Admin data plane;
   - must become GitHub-recoverable before it is considered disaster-recovery ready.

Legacy projects `ccpun-web-v4-1-uat`, `ccpun-web-v4-uat` and `ccpun-web-lab` are retirement candidates only after GitHub-controlled UAT/Preview parity is proven. Do not delete them early.

## Sanity data planes

Keep **two Sanity projects**; do not consolidate them.

| Lane | Sanity | Purpose |
|---|---|---|
| Public Production | `kyfxgjnq/production` | Published public content |
| Production Admin | `kyfxgjnq/production` | Authenticated owner/editor Draft workflow |
| UAT / Lab / Preview | `ccb9lnw5/uat` | Synthetic/non-production content |
| unknown or mismatched | none | Fail closed |

Public rendering uses the Published perspective. Draft/Studio/Admin access is allowed only in approved Admin environments.

The old `kyfxgjnq/uat` dataset, legacy category drafts and V41 document residue are cleanup candidates only after independent backup and reference verification.

## Admin workflow and safety boundary

Protected surfaces:

- `/snt-admin/` — Control Plane
- `/snt-admin/content/` — Draft inventory
- `/snt-admin/seo/` — deterministic SEO audits
- `/snt-admin/research/` — research snapshots
- `/snt-admin/reviews/` — human review / Apply to Draft
- `/snt-admin/growth/` — read-only growth signals
- `/snt-admin/audit/` — mutation history
- `/studio/` — Sanity Studio

Keep the current Control Plane hard-deny boundary for:

- Publish/Delete;
- canonical/redirect/noindex changes;
- Production deployment/configuration;
- DNS changes.

AI/system actors may analyze and create safe proposals. Human review is required before Draft mutation. Human Publish remains an explicit separate action.

## Local UAT

```bash
npm run local:uat
```

- URL: `http://localhost:3100`
- Sanity: `ccb9lnw5/uat`
- binds only to `127.0.0.1`
- Publish/Delete remain unavailable in UAT.

## Local Production Draft lane

The local owner lane remains available as a break-glass/editorial option:

- URL: `http://localhost:3000`
- Sanity: `kyfxgjnq/production`
- explicit Draft-write enable flag required;
- owner authentication required;
- public Published content does not change until Human Publish.

Do not treat local runtime as the only recovery path. Cloud Admin/GitHub/backup architecture must remain usable without the Mac.

## SEO URL architecture — V2

The approved final semantic article categories are:

- `personal-finance`
- `life-insurance`
- `health-insurance`
- `critical-illness`
- `investment`

The planned controlled URL correction is documented at:

`docs/seo/url-migration-v2-health-critical.md`

Final targets for the three moved articles:

- `/blog/health-insurance/aia-health-happy-describe/`
- `/blog/health-insurance/aia-health-ci-hero-guide/`
- `/blog/critical-illness/critical-illness-insurance/`

The current `/blog/life-insurance/...` interim paths must redirect directly to those final URLs after cutover. Do not create an avoidable redirect chain.

Production cutover is blocked until backup, UAT HTTP/SEO proof and migration guards pass.

## Taxonomy V2 commands

Self-test, no credentials:

```bash
npm run cms:taxonomy:v2:self-test
```

UAT dry-run:

```bash
npm run cms:taxonomy:v2:uat:dry-run
```

UAT apply requires an explicit UAT write token:

```bash
npm run cms:taxonomy:v2:uat:apply
```

Production dry-run uses the dedicated `production-migration` lane:

```bash
npm run cms:taxonomy:v2:production:dry-run
```

Production apply additionally requires both:

- `CCPUN_TAXONOMY_V2_APPROVED=1`
- `CCPUN_TAXONOMY_V2_BACKUP_ID=<verified backup id>`

The migration patches only article `category` references, uses revision guards and writes an audit log.

## SEO / GEO Control Plane

SEO audit checks include title/meta/keyword/slug/headings/content depth/internal links/image alt/sources/canonical/indexability plus separate GEO/readiness checks.

Automatic safe Apply-to-Draft fields remain limited to:

- `seo.title`
- `seo.description`
- `seo.focusKeyword`
- `seo.searchIntent`

Ubersuggest research is currently local-only. Before using it as an automated decision source, pin the market to Thailand/Thai and provide a cloud-safe credential/refresh model.

## Analytics

The existing analytics event layer is intentionally consent-gated and allowlisted. Calculator answers, financial values and click identifiers must not be sent as analytics parameters.

Collection and archival are separate concerns:

- Collection: GA4 / GTM / Meta
- Historical archive: Google Drive / Backup Registry

Do not weaken the consent or parameter-sanitization boundary while adding reporting.

## Independent backup

Backup vault:

`CCPun - Financial Advisor Project / 00 — System Backup`

Contains/targets:

- Backup Registry
- Blog content copies
- Article media / PDFs / attachments
- Sanity Production / Non-Production snapshots
- Website config / URL maps / recovery manifests
- GA4 / GSC / Meta historical archives

Scoped rollback snapshot already created for SEO URL Migration V2:

`PRE-SEO-V2-20260824-013527-BKK`

This scoped snapshot is sufficient to restore the category references changed by V2. It is **not** a substitute for the full disaster-recovery export of all documents/assets.

## Verification

Run before promotion:

```bash
npm ci
npm run lint
npx tsc --noEmit --incremental false
npm run test:vercel
npm run test:admin
npm run cms:taxonomy:v2:self-test
npm run build
```

UAT must additionally prove final URL 200s, direct permanent redirects, canonical alignment, sitemap/internal-link alignment, Draft noindex, and public Admin/Studio denial.

## Secrets

Never commit or print:

- `.env*`
- OAuth client secrets
- Auth.js secrets
- Sanity read/write tokens
- Vercel tokens
- provider OAuth token stores
- `.vercel/`
- `.ccpun-local/`

Use Vercel/CI/local secret configuration appropriate to the environment.
