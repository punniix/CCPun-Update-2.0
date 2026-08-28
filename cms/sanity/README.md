# CCPun Website 4.1 — Sanity and Admin Integration

Status: Implemented and hardened in the protected Lab against dataset `uat`. No Production content operation or publication is authorized.

## Goal

Sanity will act as the content editor/backend. Public article UX/UI remains owned by the existing Next.js Website 4.0 design system. The editor should feel CMS-like for writing/review, while the public page continues to use CCPun components and the transitional visual language of `blog.ccpun.com`.

## Runtime contract

Sanity adapter must implement `lib/content/types.ts` → `ContentProvider`.

- `listArticles({includeDrafts})`
- `getArticleBySlug(slug, {includeDrafts})`

The page layer must not depend directly on GROQ or Sanity document shapes.

## Content model

`content-model.ts` remains the conceptual contract. `schema.ts` is the compatibility entrypoint; real definitions are organized by ownership:

- `schema/documents/` — Article/Author/Category editorial documents
- `schema/objects/` — reusable embedded editorial objects
- `admin/schema/` — Admin intelligence, research, provider and audit records
- `policy/` — Studio access and lifecycle restrictions
- `config/` — Studio structure, Presentation and publishing composition

The definitions use `defineType` / `defineField` and preserve:

- featured image + required alt text
- visible FAQ
- structured sources/references
- editorial review/fact-check/compliance status
- SEO metadata
- GEO summary/entities/questions

Sanity native Draft/Published document state remains the publication state. Editorial review status is a separate internal workflow field rather than a second public-status system.

## UAT CMS workflow

1. Create/edit Article in Sanity as Draft.
2. Move the internal review status through content/fact/compliance checks as required.
3. Preview activates authenticated Next.js Draft Mode.
4. Draft renders at `/blog/[category]/[slug]/` with the public Website UI and `noindex,nofollow`.
5. Review content, sources, SEO/GEO metadata, FAQ parity and responsive layout.
6. COO approval is required before Publish.
7. Only published content is returned to the production provider and included in `/sitemaps/blog.xml`.

## Structured-data behavior

- Draft/Review pages do not emit public article structured data.
- Published pages may emit `BlogPosting` + `BreadcrumbList`.
- `FAQPage` is emitted only when the FAQ is visible in the rendered article.
- Next.js owns JSON-LD generation; editors do not paste schema markup into article body content.

## Environment keys

Names only — values must stay in environment/connector configuration.

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `SANITY_API_READ_TOKEN` (server-only, never `NEXT_PUBLIC_`)
- `SANITY_API_WRITE_TOKEN` (server-only, Admin mutation service only)
- `SANITY_PRODUCTION_API_READ_TOKEN` (server-only, Local Production only)
- `SANITY_PRODUCTION_API_WRITE_TOKEN` (server-only, Local Production Draft mode only)
- `SANITY_STUDIO_PREVIEW_ORIGIN`

## Implemented UAT integration

1. `/studio/` mounts `NextStudio` only when the application lane and dataset are an allowed Admin pair.
2. `sanity.config.ts` includes Structure and Presentation tools.
3. `/api/preview/enable` uses Sanity's short-lived Preview URL secret validation; no public toggle remains.
4. `lib/content/sanity.ts` uses `published` perspective normally and `drafts` perspective only after Next Draft Mode is enabled.
5. `lib/content/provider.ts` may use the local provider only when Sanity configuration is absent; an environment/dataset mismatch fails closed and never falls back from `uat` to `production`.
6. `scripts/create-sanity-uat-draft.mjs` can idempotently create one UAT article draft plus supporting draft references. It refuses non-UAT mode and any non-`drafts.` document ID.
7. SanityLive uses the server-only read token; browser token forwarding is disabled. Visual Editing is available only through the protected Studio Presentation workflow.
8. Admin approval/apply mutations are revision-guarded and write their Control Plane audit record atomically. Direct Studio edits remain visible through Sanity History instead.
9. Production/domain/DNS, Production credentials and content publication remain separate and require explicit COO approval.

## Local Production on Mac

- `npm run local:production:read` pins `kyfxgjnq/production`, accepts the owner account only, and disables every write plus Studio.
- `npm run local:production:draft` uses the same exact lane and enables existing-Draft editing only. Publish, delete, unpublish, duplicate, new-document creation and automated approval remain unavailable.
- Local Production never reuses `SANITY_API_READ_TOKEN` or `SANITY_API_WRITE_TOKEN` from UAT. Missing Production-specific credentials fail closed.
