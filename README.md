# CCPun Website 4.0

Current development source for `ccpun.com`.

## Runtime

- Next.js 16.3 / App Router
- React 19
- Tailwind CSS v4
- Vercel-native server runtime for Website 4.0 UAT
- Kanit / warm-charcoal + gold design system

Production has **not** been migrated yet. The current live site remains on the existing production infrastructure until COO approves cutover.

## Local UAT

```bash
npm install
npm run lint
npm run build
CCPUN_UAT_MODE=1 NEXT_PUBLIC_GA_ID= NEXT_PUBLIC_META_PIXEL_ID= npm run start -- -p 3001
```

Open `http://localhost:3001`.

### Draft article preview

Drafts are hidden in normal mode. Sanity Studio is embedded at:

`/studio/`

The Presentation tool calls `/api/preview/enable` with a short-lived Sanity Preview URL secret. Direct unauthenticated requests are rejected. Disable preview at:

`http://localhost:3001/api/preview/disable`

Studio and Preview enablement are available only when `VERCEL_ENV=preview` or `CCPUN_UAT_MODE=1`. A future Production build returns 404 for `/studio/` and the Preview enable route.

## Content architecture

- Public blog hub: `/blog/`
- Article route: `/blog/[slug]/`
- Provider contract: `lib/content/types.ts`
- Sanity provider: `lib/content/sanity.ts`
- Local/no-CMS fallback: `lib/content/local.ts`
- Sanity schemas: `cms/sanity/schema.ts`
- Draft articles are `noindex,nofollow` and excluded from sitemap.

Sanity Draft Mode uses the server-only read token. The browser Studio uses Sanity authentication and public project/dataset identifiers; no API token is bundled client-side. SanityLive and Visual Editing are intentionally deferred until controlled Draft Mode is stable.

During transition, Blog UX/UI intentionally mirrors `blog.ccpun.com` v4 editorial patterns while reusing the shared CCPun brand tokens and navigation foundation.

## Sitemap

`/sitemap.xml` is the master sitemap index:

- `/sitemaps/core.xml`
- `/sitemaps/tools.xml`
- `/sitemaps/blog.xml`

Only published article URLs may enter `blog.xml`. The Blog hub itself is indexable in `core.xml`.

## Legacy redirects

Next.js owns permanent redirects in `next.config.ts`:

- `/living-benefits/*` → `/ci-planning/`
- `/tools/fhc/*` → `/tools/financial-health-check/`

Static-host artifacts such as `CNAME`, `.nojekyll`, `public/_headers`, and the old static post-processing script are retired from Website 4.0 source.

## QA gates

The responsive UAT matrix is fixed at:

`320 / 375 / 390 / 414 / 820 / 1024 / 1440 px`

Before any deployment decision:

```bash
npm run lint
npm run build
npm run test:vercel
npm audit --omit=dev --audit-level=high
UAT_BASE_URL=http://localhost:3001 npm run qa:site
UAT_BASE_URL=http://localhost:3001 npm run qa:blog
```

The responsive suites must be run sequentially because both control the same managed Chrome/CDP session during calculator state testing.

Production deployment, DNS changes, Vercel domain attachment, Sanity publishing, and content publication remain COO-controlled actions.


## Environment separation contract

Website 4.0 uses separate Vercel projects for operational clarity while keeping one canonical Next.js source and one Sanity project.

### Current UAT

- Local development branch: `v4-cloud-preview-review`
- Frozen local UAT baseline: `v4-vercel-sanity-uat` at the last approved Local UAT checkpoint
- Vercel UAT project: `ccpun-web-v4-uat`
- UAT has no `ccpun.com` custom domain
- UAT is protected by Vercel Authentication / SSO protection
- UAT is `noindex,nofollow` at HTTP header, metadata, and `robots.txt` levels
- Production analytics are disabled unless `VERCEL_ENV=production` and `CCPUN_ENABLE_PRODUCTION_ANALYTICS=1`
- Sanity content used for UAT must remain Draft/Preview until COO explicitly approves publication

### Future Production

Production is intentionally not created during UAT. When COO approves a production launch:

- Create/use a separate Vercel project such as `ccpun-web-v4-prod`
- Attach `ccpun.com` only to the Production project
- Production reads Sanity published content; UAT may read Draft content through authenticated Draft Mode
- Create a production Git tag/checkpoint only after a real production release, using a convention such as `prod-v4.0.0-YYYY-MM-DD`
- Never use the production checkpoint/tag as the normal development workspace

### Release workflow

`Develop locally → ccpun-web-v4-uat → online QA/review → COO approval → production checkpoint → ccpun-web-v4-prod`

UX/UI experiments, including Blog redesigns, stay in UAT until approved. Published production UI/content must remain unchanged while UAT work continues.
