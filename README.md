# CCPun Website 4.1 — Admin & Intelligence Lab

Current Lab source for the private CCPun Control Plane layered on the Website 4.0 public foundation.

This repository is not the public Production deployment source and does not authorize a Production deploy, Sanity `production` mutation, DNS change or content publication.

## Runtime

- Next.js 16.3 / App Router
- React 19
- Tailwind CSS v4
- Sanity 5 / `next-sanity`
- Auth.js with Google OAuth and email allowlists
- Vercel-native server runtime

Stable protected Lab entry:

- Control Plane: `https://ccpun-web-lab-punniixs-projects.vercel.app/snt-admin/`
- Sanity Studio: `https://ccpun-web-lab-punniixs-projects.vercel.app/studio/`

Stable protected UAT entry:

- Control Plane: `https://ccpun-web-v4-1-uat-punniixs-projects.vercel.app/snt-admin/`
- Sanity Studio: `https://ccpun-web-v4-1-uat-punniixs-projects.vercel.app/studio/`

Lab and UAT use the isolated Sanity Non-Production project `ccb9lnw5` and dataset `uat`. They must fail closed instead of falling back to the real Production project `kyfxgjnq/production`.

## Environment contract

| Application lane | Sanity dataset | Purpose |
|---|---|---|
| `local-uat` | `ccb9lnw5/uat` only | Owner-safe Mac runtime for testing the complete Draft workflow |
| `development`, `lab`, `uat` | `uat` only | Development, QA and synthetic Draft workflows |
| `production-admin` | `production` only | Future private Production editorial tool; code boundary only |
| public `production` | `production`, Published perspective only | Public website rendering; Admin/Studio disabled |
| missing, unknown or mismatch | none | Fail closed |

The future private Production Admin project exists but remains paused and disconnected from Production credentials/data. It is a deferred always-on/multi-device deployment option, not a dependency for the Local Ubersuggest, SEO, GEO or Growth Dashboard path. See `docs/admin-layer/environment-boundary.md`.

## Local UAT on Mac

Start the protected UAT runtime with:

```bash
npm run local:uat
```

Then open `http://localhost:3100/snt-admin/`. The command binds only to the Mac loopback interface `127.0.0.1` and pins the application to the separate Sanity project `ccb9lnw5`, dataset `uat`. Requests using another host or port return `404`; Production project `kyfxgjnq` is rejected by the shared data-plane guard.

Google OAuth must contain the exact authorized redirect URI `http://localhost:3100/api/auth/callback/google`. Credentials stay in untracked local environment configuration. Local UAT keeps Publish, Unpublish, Delete and scheduled publishing unavailable; it is for creating/editing test Drafts, SEO audits, research snapshots, human review, Apply to Draft and Preview only.

The article editor supports headings, lists, quotes, safe links, callouts, inline images with required alt text, galleries, CTA buttons, PDF cards, expandable details, tables and dividers. Every custom block is validated before rendering on the public theme. Custom HTML/scripts and video embeds are intentionally unavailable; video requires a consent-safe player first.

## Local Production Draft on Mac

The owner uses the single native `CCPun Admin.app` installed on the Desktop. Its control window shows the current server/CORS status and provides `เปิดระบบ`, `ปิดระบบ` and `ออกและปิดระบบ`. Opening adds only `http://localhost:3000` to Sanity CORS with credentials, starts the loopback-only `local:production:draft` runtime and opens Safari. Closing stops only the process recorded by the app and removes that exact CORS origin.

The launcher fails closed if Sanity CORS cannot be verified, another program owns port `3000`, or the local runtime does not bind only to `127.0.0.1`. Runtime state and logs stay in the ignored `.ccpun-local/` directory with owner-only permissions. This lane reads the real `kyfxgjnq/production` dataset and permits the authenticated owner to create and edit Articles, Preview, Human Publish, Unpublish and schedule a Draft through native Sanity Studio. Studio autosaves field changes to the same Sanity Draft; the public page remains on the Published version until the owner publishes. A Published Article must be Unpublished before the permanent Draft delete action appears.

These native Studio actions do not authorize AI/system or Control Plane APIs to Publish/Delete, and they do not grant canonical, redirect, noindex, Production deploy or DNS changes. Local UAT keeps all Publish/Unpublish/Delete/schedule actions disabled.

Local UAT and Local Production are intentionally concurrent and isolated:

| Lane | URL | Sanity | Session/build state |
|---|---|---|---|
| Local UAT | `http://localhost:3100` | `ccb9lnw5/uat` | `ccpun-uat.authjs.*`, `.ccpun-local/next-uat` |
| Local Production | `http://localhost:3000` | `kyfxgjnq/production` | `ccpun-production.authjs.*`, `.ccpun-local/next-production` |

Each lane rejects the other lane's Host/port with `404`. Neither lane may reuse the other lane's dataset or silently fall back when its own data plane is unavailable.

## Admin workflow

Routes:

- `/snt-admin/` — owner start page
- `/snt-admin/content/` — Draft inventory
- `/snt-admin/seo/` — deterministic SEO audits
- `/snt-admin/research/` — normalized research snapshots
- `/snt-admin/reviews/` — human approval and Apply to Draft
- `/snt-admin/audit/` — Control Plane mutation history
- `/studio/` — Sanity editing and Draft Preview

The current safe flow is:

`Audit → Human edit in Studio → Preview → Human Publish`

The proposal/review/apply lane remains available for proposals backed by sufficient evidence, but automatic SEO Title, Meta description and Search intent generation is disabled until the relevant keyword/SERP/GSC evidence exists.

Human and AI actors may analyze; system actors may run deterministic audits only. Any future generated proposal still requires human review. AI/system actors may not approve, Apply to Draft, publish, delete or change canonical/redirect/noindex/Production configuration.

## Content architecture

- Public blog hub: `/blog/`
- Canonical article route: `/blog/[category]/[slug]/`
- Legacy one-segment article URLs redirect to the canonical category route
- Provider contract: `lib/content/types.ts`
- Sanity provider: `lib/content/sanity.ts`
- Local/no-CMS fallback: `lib/content/local.ts`
- Sanity schemas: `cms/sanity/schema.ts`

Normal public reads use the Published perspective. Authenticated Draft Mode is available only in an allowed Admin lane/dataset pair. Draft pages are `noindex,nofollow` and excluded from the sitemap.

Sanity Live uses the server-only read token and does not forward it to the browser. Studio uses Sanity authentication plus public project/dataset identifiers.

## Configuration names

Values belong in local/Vercel Sensitive environment configuration and must never be committed or printed.

- `CCPUN_APP_ENV`
- `CCPUN_PRODUCTION_ADMIN_VERCEL_PROJECT_ID` (future private Production Admin only; must equal Vercel's current `VERCEL_PROJECT_ID`)
- `NEXT_PUBLIC_CCPUN_APP_ENV`
- `CCPUN_ADMIN_OWNER_EMAILS`
- `CCPUN_ADMIN_EDITOR_EMAILS`
- `CCPUN_ADMIN_ANALYST_EMAILS`
- `CCPUN_ADMIN_VIEWER_EMAILS`
- `AUTH_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `SANITY_API_READ_TOKEN`
- `SANITY_API_WRITE_TOKEN`
- `SANITY_STUDIO_PROJECT_ID`
- `SANITY_STUDIO_DATASET`

Do not copy `.env*`, OAuth JSON, tokens or `.vercel/` into Git.

## Local verification

Use the explicit Local UAT lane; never use Production credentials for local verification.

```bash
npm install
npm run local:uat
npm run test:admin
npm run test:vercel
npm run lint
npx tsc --noEmit --incremental false
npx sanity schema validate
npm run guard:admin-lab
npm run build:admin-lab -- --webpack
npm audit --omit=dev --audit-level=high
```

The responsive public-site suites remain available separately through `qa:site`, `qa:blog`, `qa:home` and `qa:tracking` when their exact scope is required.

## Audit authority

`/snt-admin/audit/` records Control Plane mutations with request IDs. Direct Studio Draft edits and Human Publish use Sanity History. Before activating a Production Admin, verify Sanity History retention/access, least-privilege membership, administrator-email retention and recoverable backups.

## Release order

Active Local path:

`Lab checkpoint → UAT release candidate → read-only Production inventory → Local Production Draft lane → Ubersuggest UAT → Local Production research → deterministic GEO → Growth Dashboard → final security review → owner-controlled Publish gate`

Current checkpoint (2026-08-22): SOL-H1–H3 source implementation and the independent `gpt-5.6-sol / xhigh` adversarial review are complete with no residual P0/P1. Ubersuggest owner OAuth, the first Local UAT keyword acceptance and approved read-only Growth credentials remain separate runtime gates. No Production publish/deploy/content mutation is included.

Deferred Cloud path:

`accepted Local system → commercial hosting approval → protected Production Admin → admin.ccpun.com → multi-device owner handoff`

The Cloud path changes hosting and access convenience; it does not unlock or require a rewrite of the Local intelligence workflow.

Committing this Lab source is a local source checkpoint only. Push, UAT deploy and every Production action require their own explicit approval.
