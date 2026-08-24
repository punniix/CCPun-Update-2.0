# SEO URL Migration V2 — Health Insurance / Critical Illness

Status: **planned / UAT-first / do not release directly to Production**

Decision date: 2026-08-24 (Asia/Bangkok)

## Goal

Restore semantically specific canonical article paths for Health Insurance and Critical Illness while preserving Life Insurance paths for genuinely life-insurance content.

This migration is intentionally treated as a final URL architecture correction. Navigation taxonomy may evolve later without forcing another article URL migration.

## Final canonical mapping

| Article | Current canonical | Final canonical |
|---|---|---|
| AIA Health Happy | `/blog/life-insurance/aia-health-happy-describe/` | `/blog/health-insurance/aia-health-happy-describe/` |
| AIA Health CI Hero | `/blog/life-insurance/aia-health-ci-hero-guide/` | `/blog/health-insurance/aia-health-ci-hero-guide/` |
| Critical Illness guide | `/blog/life-insurance/critical-illness-insurance/` | `/blog/critical-illness/critical-illness-insurance/` |

Keep Life Insurance paths for content whose primary semantic category is Life Insurance.

## Redirect contract

Every historical path must redirect **directly to the final destination**.

### AIA Health Happy

- `/blog/health-insurance/aia-health-happy-describe/` was the historical category URL and becomes canonical again; it must return 200 after cutover.
- `/blog/life-insurance/aia-health-happy-describe/` -> 308 -> `/blog/health-insurance/aia-health-happy-describe/`
- `/blog/aia-health-happy-describe/` -> 308 -> `/blog/health-insurance/aia-health-happy-describe/`
- WordPress legacy source must resolve directly to the final URL, not through `/life-insurance/`.

### AIA Health CI Hero

- `/blog/health-insurance/aia-health-ci-hero-guide/` becomes canonical and returns 200.
- `/blog/life-insurance/aia-health-ci-hero-guide/` -> 308 -> `/blog/health-insurance/aia-health-ci-hero-guide/`
- `/blog/aia-health-ci-hero-guide/` -> 308 -> final URL.
- WordPress legacy source must resolve directly to the final URL.

### Critical Illness

- `/blog/critical-illness/critical-illness-insurance/` becomes canonical and returns 200.
- `/blog/life-insurance/critical-illness-insurance/` -> 308 -> `/blog/critical-illness/critical-illness-insurance/`
- `/blog/critical-illness-insurance/` -> 308 -> final URL.
- WordPress legacy source must resolve directly to the final URL.

There must be no avoidable `old -> life-insurance -> final` chain after cutover.

## Sanity target taxonomy

Production/UAT primary category references after migration:

- Health Happy -> `health-insurance`
- Health CI Hero -> `health-insurance`
- Critical Illness guide -> `critical-illness`

Required category documents:

- `personal-finance`
- `life-insurance`
- `health-insurance`
- `critical-illness`
- `investment`

Navigation UI may still group these under a higher-level Insurance presentation layer later. Article canonical paths remain semantically specific.

## Release gates

### Gate 0 — Backup

Before any Production mutation:

- record current Git SHA and Vercel Production deployment;
- snapshot Sanity Production documents/drafts/assets;
- snapshot current blog sitemap and URL map;
- archive pre-migration GSC page/query data;
- create a recovery manifest in the CCPun Google Drive backup vault.

### Gate 1 — Code + UAT data

- implement final URL mapping and redirect tests;
- seed/migrate **ccb9lnw5/uat only**;
- Node runtime parity with Production;
- CI green;
- no Production mutation.

### Gate 2 — UAT HTTP/SEO proof

For each moved article prove:

- final URL = 200;
- current `/life-insurance/` URL = 308 directly to final;
- one-segment legacy URL = 308 directly to final;
- canonical = final URL;
- BreadcrumbList = final hierarchy;
- Article `articleSection` = semantically correct topic;
- sitemap includes final URL only;
- internal links point to final URL;
- draft preview remains `noindex,nofollow`;
- public Admin/Studio routes remain denied.

### Gate 3 — Production migration

Run a separately approved Production migration that:

1. verifies exact expected source revisions and category state;
2. creates/restores target categories if required;
3. reassigns the three article category references;
4. preserves tags and unrelated article fields;
5. writes an audit log;
6. aborts on unexpected state;
7. can be dry-run and self-tested before apply.

Production code release and Sanity data migration must be coordinated as one controlled cutover.

### Gate 4 — Post-cutover verification

Immediately verify:

- 200/308 matrix;
- canonical/meta/schema;
- `sitemaps/blog.xml`;
- no 404/5xx/runtime errors;
- GA4 continues recording final page paths;
- GSC sitemap submitted/refreshed;
- URL Inspection requested for the three final canonical URLs where useful.

Monitor GSC page/query data for the old and final URLs during reprocessing. Temporary ranking/visibility fluctuation is expected during a URL move.

## Long-term rule

After this migration, do **not** move article URLs merely because navigation/filter labels change. Use presentation grouping, topic hubs and search/filter UX without forcing another canonical URL migration.

Permanent redirects should be retained for at least one year and preferably indefinitely for user-facing historical links.