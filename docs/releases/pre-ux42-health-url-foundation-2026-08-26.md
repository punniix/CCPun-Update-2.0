# Pre-UX/UI 4.2 Health URL Foundation — 2026-08-26

## Scope

This is a Foundation/SEO migration before UX/UI 4.2. It does not change layout, typography, visual components, or UX behavior.

Approved final owners:

- `https://ccpun.com/blog/health-insurance/aia-health-happy-describe/`
- `https://ccpun.com/blog/health-insurance/aia-health-ci-hero-guide/`

## Cutover contract

- Former CCPun `/blog/life-insurance/...` paths for the two Health winner pages redirect directly to the final Health URL.
- Historical WordPress URLs must ultimately redirect directly to the final Health URL with no intermediate CCPun Life hop.
- Canonical, Open Graph URL, JSON-LD `mainEntityOfPage`, internal article links, Search Intent Owner Registry and Blog sitemap must all agree on the final Health URL.
- `/sitemaps/blog.xml` is canonical-only, indexable-only, deduplicated and sorted.
- `/robots.txt` uses one public wildcard rule and blocks only private/non-content surfaces: `/api/`, `/snt-admin/`, `/studio/`.
- Critical Illness physical URL ownership is unchanged in this release.

## Sanity transition safety

- Rollback release created: `pre-health-url-cutover-2026-08-26`.
- Published Health Insurance category `ccpun-wp-category-127` is available in Production.
- Existing drafts for Health Happy and Health CI Hero now reference the Health Insurance category.
- The two article drafts are intentionally NOT published by this migration because they contain unrelated unpublished SEO/FAQ work.
- Runtime canonical-category overrides keep the public URL correct while published Sanity article references naturally converge later.

## Release phases

1. PR/Preview: legacy ledger keeps the two historical WordPress mappings in `planned` state so live pre-cutover Production remains testable.
2. Production cutover: deploy the routing/canonical/sitemap/robots contracts.
3. Post-cutover verification: confirm one-hop redirects, self-canonicals, clean sitemap and robots.
4. Freeze ledger: mark Health mappings `live` and add former CCPun Life paths as explicit live legacy sources.

## Rollback

- Code: revert the cutover merge commit.
- Content taxonomy: use the recorded pre-cutover Sanity release/version evidence if category references need restoration.
- No UX/UI 4.2 work depends on this change until the Foundation cutover is verified.
