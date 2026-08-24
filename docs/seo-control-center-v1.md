# CCPun SEO Control Center v1

Status: Foundation implementation for UAT/Preview validation before UX/UI 4.2.

## Goal

Make routine SEO editing easy while making URL/indexing changes difficult to do accidentally.

This layer does not replace the existing SEO audit control plane. It combines the existing audit workflow with a safer Sanity editing experience.

## Safe editorial fields

Editors may update these through the normal article draft workflow:

- SEO Title
- Meta Description
- Focus keyword
- Secondary keywords
- Search Intent
- Semantic Topic
- Featured image / alt text
- Author / sources / review metadata

`Semantic Topic` describes what the article means in the CCPun knowledge graph. It is intentionally separate from the physical category segment used by the canonical URL.

## Protected SEO fields

After an article has a `publishedAt` value, these fields are read-only in Sanity Studio:

- URL Slug
- Primary category used by the URL path
- Canonical override
- Noindex

This protects published URLs and indexability from accidental edits. The locked state is an editorial guardrail; it does not rewrite existing content.

Redirect ownership remains in code/URL migration contracts rather than an editable CMS field.

## SEO Migration Workflow

A requested change to a protected field is not a normal content edit. It must be implemented as a dedicated migration that coordinates:

1. final destination URL
2. one-hop permanent redirect from every historical URL
3. canonical
4. sitemap ownership
5. internal links
6. breadcrumb/schema URL identity
7. `qa/legacy-url-ledger.json`
8. regression tests
9. Preview/UAT validation
10. explicit human approval before Production

## Control Center UI

The Sanity SEO object shows:

- Google-style title/description/URL preview
- readiness status for title, description, topic, intent, featured image, author, sources and indexability
- whether the article is Draft or Published
- a protected-field warning
- the latest stored CCPun SEO audit score

The preview is informational and does not claim to reproduce Google's SERP rendering exactly.

## Non-goals for v1

- no AI auto-writing of SEO Title or Meta Description
- no automatic keyword ownership decisions
- no automatic redirect or canonical changes
- no automatic publishing
- no changes to GA4, GTM, Meta Pixel or Consent Mode
- no migration of existing winner URLs

## Current migration rule

Physical URL stability and semantic classification are separate. A page may remain under its current canonical category path while being classified under a different Semantic Topic.

AIA Health CI Hero remains semantically Health insurance / medical-expense coverage and must not be treated as critical-illness lump-sum coverage.
