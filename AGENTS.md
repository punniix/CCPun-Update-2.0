<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CCPun Production Governance

Read `docs/architecture/platform-governance-20260824.md` before changing deployment, Sanity, SEO URL, Admin, analytics or environment behavior.

## Source and branch contract

- `v4-production` is the live Public Production source branch. A push/merge can deploy `ccpun.com`.
- `uat` is the integration/UAT branch.
- Use `feature/*`, `fix/*` or `chore/*` for work.
- `main` is legacy. Never merge it into `v4-production` merely to sync history.
- Normal flow: work branch -> PR to `uat` -> CI/UAT -> PR to `v4-production` -> human Production approval.

Do not routinely execute a Production Vercel CLI deploy from a local-only commit. Production code must be recoverable from GitHub.

## Current live Admin recovery warning

`admin.ccpun.com` is live on Vercel project `ccpun-admin-prod`.

Current recovery reference:

- deployment: `dpl_FNgkY5UC86pmnJKPPDi7nVFLMjf8`
- CLI source branch metadata: `codex/admin-prod-candidate-20260823`
- source SHA metadata: `291d0983e67d70a44f9170273cd74f432a9055d7`

That exact SHA is not currently present in GitHub. Do not overwrite the live Admin deployment or claim it is source-controlled until the original working tree is pushed and parity is verified.

## Vercel topology

Target steady state is exactly two active application projects:

1. Public Web — `ccpun-web-v4-prod`
2. Private Admin — `ccpun-admin-prod`

Legacy UAT/Lab projects are retirement candidates only after GitHub-controlled UAT/Preview parity is proven. Do not delete them early.

Use Node 22 during consolidation for Production/UAT parity. Node 24 upgrade is a separate project.

## Sanity data-plane contract

Keep two Sanity projects:

- Production: `kyfxgjnq/production`
- Non-production/UAT: `ccb9lnw5/uat`

Never silently fall back between them. Unknown/mismatched data planes fail closed.

Public Web reads Published perspective only. Draft/Studio/Admin access is restricted to approved Admin lanes.

Do not delete legacy Sanity categories, V41 documents or old UAT evidence until independent backup and reference checks are complete.

## Control Plane hard denies

Do not remove or bypass hard-deny controls for:

- Publish/Delete through Control Plane APIs;
- canonical/redirect/noindex changes;
- Production configuration/deployment;
- DNS changes.

AI/system actors may analyze and propose. Human review is required before Draft mutation. Human Publish stays separate.

## SEO URL Migration V2

Read `docs/seo/url-migration-v2-health-critical.md`.

Final canonical article paths include:

- `/blog/health-insurance/aia-health-happy-describe/`
- `/blog/health-insurance/aia-health-ci-hero-guide/`
- `/blog/critical-illness/critical-illness-insurance/`

Interim `/blog/life-insurance/...` paths for those three articles must redirect directly to the final path after cutover. Avoid redirect chains.

Never run Production taxonomy V2 apply without:

- verified pre-migration backup ID;
- UAT proof;
- explicit `CCPUN_TAXONOMY_V2_APPROVED=1`;
- dedicated `production-migration` lane;
- exact `kyfxgjnq/production` target.

The V2 migration may change only category references for its three controlled article slugs. Preserve body/title/SEO/tags/publish state.

## Analytics/privacy

Keep the consent-gated allowlisted analytics layer. Never add calculator answers, financial values, health/client data or click identifiers to analytics event params.

## Required checks

Before promotion run:

- `npm ci`
- `npm run lint`
- `npx tsc --noEmit --incremental false`
- `npm run test:vercel`
- `npm run test:admin`
- `npm run cms:taxonomy:v2:self-test`
- `npm run build`

Never commit `.env*`, tokens, OAuth secrets, `.vercel/` or `.ccpun-local/`.
