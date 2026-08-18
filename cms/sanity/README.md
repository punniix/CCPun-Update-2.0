# CCPun Website 4.0 — Sanity Integration Material

Status: Implemented for Vercel UAT. No content publication is authorized.

## Goal

Sanity will act as the content editor/backend. Public article UX/UI remains owned by the existing Next.js Website 4.0 design system. The editor should feel CMS-like for writing/review, while the public page continues to use CCPun components and the transitional visual language of `blog.ccpun.com`.

## Runtime contract

Sanity adapter must implement `lib/content/types.ts` → `ContentProvider`.

- `listArticles({includeDrafts})`
- `getArticleBySlug(slug, {includeDrafts})`

The page layer must not depend directly on GROQ or Sanity document shapes.

## Content model

`content-model.ts` remains the conceptual contract. `schema.ts` implements the real Sanity Article/Author/Category documents and reusable objects with `defineType` / `defineField`:

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
4. Draft renders at `/blog/[slug]/` with Website 4.0 UI and `noindex,nofollow`.
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
- `SANITY_STUDIO_PREVIEW_ORIGIN`

## Implemented UAT integration

1. `/studio/` mounts `NextStudio` only in Local UAT or Vercel Preview.
2. `sanity.config.ts` includes Structure and Presentation tools.
3. `/api/preview/enable` uses Sanity's short-lived Preview URL secret validation; no public toggle remains.
4. `lib/content/sanity.ts` uses `published` perspective normally and `drafts` perspective only after Next Draft Mode is enabled.
5. `lib/content/provider.ts` falls back to the local provider only when Sanity project/dataset configuration is absent.
6. `scripts/create-sanity-uat-draft.mjs` can idempotently create one UAT article draft plus supporting draft references. It refuses non-UAT mode and any non-`drafts.` document ID.
7. SanityLive and Visual Editing are not enabled in this first UAT version.
8. Production/domain/DNS and WordPress migration remain separate and require COO approval.
