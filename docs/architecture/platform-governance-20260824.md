# CCPun Platform Governance — 2026-08-24

This document is the authoritative deployment and data-plane contract for CCPun.

## Source of truth

- Repository: `punniix/CCPun-Update-4.0`
- Production source branch: `v4-production`
- UAT integration branch: `uat`
- Work branches: `feature/*`, `fix/*`, `chore/*`
- `main` is legacy and MUST NOT be merged into `v4-production` without a deliberate reconciliation project.

A push/merge into `v4-production` may deploy the public Production website. Treat it as a Production action.

## Required release path

Normal change flow:

`work branch -> PR to uat -> CI -> Preview/UAT verification -> PR from uat to v4-production -> CI -> human release approval -> Production`

Exceptions are limited to an owner-authorized emergency hotfix. The emergency path must still be committed to GitHub first and documented after recovery.

## Prohibited deployment behavior

Agents and humans MUST NOT routinely:

- deploy `vercel --prod` from a local-only commit;
- deploy Production from a commit that is not recoverable from GitHub;
- mutate Sanity `kyfxgjnq/production` as part of a code deployment unless the migration is separately approved, backed up, self-tested and auditable;
- change DNS, canonical URLs, redirects, `noindex`, Publish/Delete controls or Production credentials as an incidental change;
- merge `main` into `v4-production` to "sync" branches.

## Vercel topology

Target topology is **2 Vercel projects**:

1. Public Web
   - current project: `ccpun-web-v4-prod`
   - Production: `ccpun.com`, `www.ccpun.com`
   - Production source: GitHub `v4-production`
   - UAT target: same application source, Node 22, branch `uat`, isolated non-production Sanity.
   - feature branches use Preview deployments.

2. Private Admin
   - current project: `ccpun-admin-prod`
   - Production domain: `admin.ccpun.com`
   - must remain separate from the public web project;
   - Production data plane: `kyfxgjnq/production` only;
   - must be source-controlled and reproducible from GitHub before it is considered recovery-ready.

Legacy duplicate Vercel projects (`ccpun-web-v4-1-uat`, `ccpun-web-v4-uat`, `ccpun-web-lab`) are retirement candidates only after GitHub-controlled UAT/Preview parity is proven. Do not delete them before that checkpoint.

## Node runtime

During consolidation, Web/UAT/Admin validation uses Node 22 for Production parity. Node 24 is a separate upgrade project and MUST NOT be coupled to environment consolidation or SEO URL migration.

## Sanity topology

Keep **2 Sanity projects**. Do not consolidate them.

- Production: `kyfxgjnq/production`
- Non-production/UAT: `ccb9lnw5/uat`

The old `kyfxgjnq/uat` dataset and V41/legacy document residue are archival/cleanup candidates. No cleanup occurs before independent backup exists and references have been checked.

Public Web reads Published perspective only. Draft/Studio/Admin access is restricted to approved Admin lanes. Unknown or mismatched project/dataset/environment combinations must fail closed.

## Admin control boundary

Keep the current hard-deny policy for:

- Publish/Delete through Control Plane APIs;
- canonical/redirect/noindex changes;
- Production deployment/config changes;
- DNS changes.

AI/system actors may analyze and create safe proposals. Human review remains mandatory before draft mutations. Human Publish remains an explicit boundary.

## SEO URL policy

SEO URLs are governed separately from navigation presentation. Any URL migration requires:

1. independent backup checkpoint;
2. explicit old -> final URL map;
3. UAT verification;
4. direct permanent redirects to the final destination (no avoidable redirect chain);
5. canonical, sitemap, structured data and internal links updated in the same release;
6. GSC/analytics monitoring after release;
7. redirects retained for at least one year and preferably indefinitely for users.

The approved next URL architecture is documented in `docs/seo/url-migration-v2-health-critical.md`.

## Analytics

Keep the consent-gated semantic event layer and safe allowlist. Calculator answers, financial values, click identifiers and other sensitive values must never be added to analytics parameters.

Analytics collection and analytics archival are separate concerns. GA4/GSC/Meta historical snapshots should be archived independently in Google Drive without personal lead/client data.

## Backup and recovery

Independent backup destination:

`CCPun - Financial Advisor Project / 00 — System Backup`

Backup scope includes:

- Sanity Production documents/drafts and assets;
- human-readable article copies;
- article media/PDFs/attachments;
- URL/redirect/canonical maps;
- deployment/recovery manifests;
- GA4/GSC/Meta aggregate snapshots.

No destructive Sanity cleanup is allowed until the backup checkpoint is recorded.

## Device and vendor independence

The architecture must remain operable when a Mac/local Codex runtime is unavailable. Cloud Admin, GitHub, CI, Sanity and backup/recovery must be sufficient for normal editorial/recovery work.

Vercel is the current hosting layer, not the application architecture. Pro-only features must have a documented fallback (Preview-as-UAT or migration to another commercial Next.js-compatible host).