# CCPun Website 4.1 — Admin & Intelligence

Source repository for the CCPun public website foundation, protected Admin Control Plane, Sanity Studio policies and SEO/GEO intelligence workflows.

Changes in this repository do not authorize a Production deploy, Sanity `production` mutation, DNS change or content publication by themselves. Production releases must be traceable to a reviewed Git commit and pass the configured verification gates.

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

Protected Production Admin entry:

- Control Plane: `https://admin.ccpun.com/snt-admin/`
- Sanity Studio: `https://admin.ccpun.com/studio/`
- Sanity data plane: `kyfxgjnq/production`

Lab and UAT use the isolated Sanity Non-Production project `ccb9lnw5` and dataset `uat`. They must fail closed instead of falling back to the real Production project `kyfxgjnq/production`.

## Environment contract

| Application lane | Sanity dataset | Purpose |
|---|---|---|
| `local-uat` | `ccb9lnw5/uat` only | Owner-safe Mac runtime for testing the complete Draft workflow |
| `development`, `lab`, `uat` | `uat` only | Development, QA and synthetic Draft workflows |
| `production-admin` | `kyfxgjnq/production` only | Protected multi-device Production editorial Control Plane and Studio |
| `local-production` | `kyfxgjnq/production` only | Owner-only Mac Production Draft workflow |
| public `production` | `production`, Published perspective only | Public website rendering; Admin/Studio disabled |
| missing, unknown or mismatch | none | Fail closed |

`admin.ccpun.com` is an active private Production Admin surface. The release source must remain auditable: future Admin Production deployments must originate from a reviewed commit in this repository and record the source commit in deployment metadata. Do not promote an untracked local/Codex filesystem state directly to Production.

## Local UAT on Mac

Start the protected UAT runtime with:

```bash
npm run local:uat
```

Then open `http://localhost:3100/snt-admin/`. The command binds only to the Mac loopback interface `127.0.0.1` and pins the application to the separate Sanity project `ccb9lnw5`, dataset `uat`. Requests using another host or port return `404`; Production project `kyfxgjnq` is rejected by the shared data-plane guard.

Google OAuth must contain the exact authorized redirect URI `http://localhost:3100/api/auth/callback/google`. Credentials stay in untracked local environment configuration. Local UAT keeps Publish, Unpublish, Delete and scheduled publishing unavailable; it is for creating/editing test Drafts, SEO audits, research snapshots, human review, Apply to Draft and Preview only.

The article editor supports headings, lists, quotes, safe links, callouts, inline images with required alt text, galleries, CTA buttons, PDF cards, expandable details, tables and dividers. Every custom block is validated before rendering on the public theme. Custom HTML/scripts and video embeds are intentionally unavailable; video requires a consent-safe player first.

## Production content lifecycle

Production article lifecycle actions are intentionally different for never-published Drafts and URLs that have already been public:

- A Draft that has never been Published may use `ลบฉบับร่าง`.
- A currently Published article may use `นำออกจากเว็บไซต์` (Sanity Unpublish).
- An article that has ever been Published remains protected from permanent Delete even after Unpublish while `publishedAt` exists.
- Permanent retirement of a previously Published URL requires a separate SEO retirement workflow that explicitly chooses Redirect, 410 Gone or an intentional 404 and checks internal links/canonical/sitemap/query ownership before destructive deletion is enabled.

This prevents an editorial cleanup action from silently turning an indexed URL into an accidental 404.

## Local Production Draft on Mac

The owner uses the single native `CCPun Admin.app` installed on the Desktop. Its control window shows the current server/CORS status and provides `เปิดระบบ`, `ปิดระบบ` and `ออกและปิดระบบ`. Opening adds only `http://localhost:3000` to Sanity CORS with credentials, starts the loopback-only `local:production:draft` runtime and opens Safari. Closing stops only the process recorded by the app and removes that exact CORS origin.

The launcher fails closed if Sanity CORS cannot be verified, another program owns port `3000`, or the local runtime does not bind only to `127.0.0.1`. Runtime state and logs stay in the ignored `.ccpun-local/` directory with owner-only permissions. This lane reads the real `kyfxgjnq/production` dataset and permits the authenticated owner to create and edit Articles, Preview, Human Publish, Unpublish and schedule a Draft through native Sanity Studio. Studio autosaves field changes to the same Sanity Draft; the public page remains on the Published version until the owner publishes.

The same URL-retirement guard applies here: never-published Drafts can be deleted, while any article carrying a publication history remains protected from permanent Delete until the SEO retirement workflow exists.

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

The proposal/review/apply foundation remains in the codebase, but automatic Search Intent, SEO Title and Meta Description generation is explicitly deferred from the current phase. This phase adds no model provider, AI API key, model-hosting requirement or AI runtime cost.

Future automated proposals, if enabled in a later phase, must still require evidence and human review. AI/system actors may not approve, Apply to Draft, publish, delete or change canonical/redirect/noindex/Production configuration.

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
- `CCPUN_PRODUCTION_ADMIN_VERCEL_PROJECT_ID` (must equal the approved Production Admin Vercel `VERCEL_PROJECT_ID`)
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

`/snt-admin/audit/` records Control Plane mutations with request IDs. Direct Studio Draft edits and Human Publish use Sanity History. Before any Production Admin release, verify Sanity History retention/access, least-privilege membership, administrator-email retention, recoverable backups and the exact source commit.

## Release order

Active protected path:

`Git branch → automated checks → Vercel Preview/UAT → human review → merged source commit → Production Admin release → owner-controlled content Publish gate`

No source change implies permission to deploy or publish. `admin.ccpun.com` must not be updated from an untracked source state.

Intelligence roadmap:

`Research/Intent ownership → GSC evidence → future automated SEO proposals (optional) → published-content optimization → SEO retirement/Redirect/410 workflow`

The Cloud Production Admin changes hosting and access convenience; it does not weaken the same Draft, review, URL-ownership or human-publish controls used by the local workflow.
