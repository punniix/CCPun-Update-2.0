# Repository architecture refactor review brief

This branch reorganizes the CCPun application in one coordinated pass so humans, Codex and other coding agents can find ownership quickly and extend Website 4.2 without recreating the previous mixed source structure.

## Architecture

- `app/` — Next.js routes, metadata and route composition.
- `features/` — product/domain features such as home, blog, planning tools and Admin capabilities.
- `core/` — protected application infrastructure including content, Sanity, auth, environment, SEO, analytics and consent boundaries.
- `shared/` — reusable UI, layout, hooks, types and utilities.
- `cms/`, `scripts/`, `qa/`, `tests/`, `workers/`, `tools/` — retain explicit operational ownership.

The legacy root source buckets `components/`, `lib/` and `hooks/` are removed. Imports and test references are updated in the same refactor.

## Codex and AI guardrails

- `AGENTS.md` directs agents to the architecture contract before code changes.
- `docs/architecture/repository-architecture.md` is the human/agent source of truth.
- A permanent automated architecture guard rejects legacy buckets and disallowed dependency directions.
- The pull-request checklist requires ownership, URL, Sanity, analytics and consent review.

## Protected contracts

- No public URL, slug, canonical, redirect or sitemap ownership change.
- No Sanity Production mutation, publication, deletion or migration.
- No analytics event rename or provider/consent behavior change.
- No Production deployment or DNS change.

## Verification

- `npm ci`
- `npm run check:foundation`
- permanent repository architecture guard
- homepage LCP regression
- SEO topic-hub regression
- FHC SEO/GEO regression
- `npm run build` on the isolated `ccb9lnw5/uat` development lane

Verification evidence is recorded at `docs/architecture/repository-architecture-verification-2026-08-28.md`.

## Review and rollback

The pull request must remain Draft until file moves, architecture rules and Vercel Preview are reviewed. Until merge, rollback is closing the PR and deleting the branch. After merge, the repository-wide refactor remains isolated in traceable commits and can be reverted without changing Sanity content or public URL ownership.
