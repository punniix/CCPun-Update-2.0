# A0 — Sanity Production Content Inventory

Date: 2026-08-21
Scope: Sanity project `kyfxgjnq`, dataset `production`
Mutation/deploy status: approved A0 remediation completed; no deploy

## Result

The inventory and approved UAT-only cleanup are complete. The A0 acceptance gate passes.

| Check | Result |
|---|---:|
| Raw Article documents | 44 |
| Published documents | 5 |
| Draft documents | 39 |
| Logical Articles after removing the `drafts.` prefix | 39 |
| Published only | 0 |
| Published + Draft changes | 5 |
| Draft only | 34 |
| Duplicate logical slugs | 0 |
| References whose target is absent entirely | 0 |
| Articles whose Author exists only as a Draft | 34 |
| Articles whose Category exists only as a Draft | 24 |
| Articles without a declared featured-image source | 33 |
| Articles with a broken referenced body image | 0 |
| UAT-only documents in the Production dataset | 0 |

Count invariant: `44 raw = 5 published + 39 drafts`; normalizing five Published/Draft pairs gives `39 logical Articles`. The Admin query uses the Draft perspective without a row slice, so each logical Article will appear once.

## Completed remediation

The owner approved A0 Remediation only. A full Production export completed before mutation and passed gzip integrity plus SHA-256 verification.

- Backup: `/Users/punnii/Downloads/CCPun-Sanity-Production-pre-A0-remediation-20260821T180427+0700.tar.gz`
- SHA-256: `362ab618d9e3ed2bf5506d9f544adac34acad38c0041b80416fb6f4c5dcc04ac`
- Deleted in one revision-guarded transaction: `drafts.ccpun-uat-article-system`, `drafts.ccpun-uat-author`, `drafts.ccpun-uat-category`
- Request ID: `80b5eb80-b531-46d9-9d96-c2f1fc094850`
- Sanity transaction ID: `p3gd7LjQjSx3kFA5pQOc4c`
- Audit document: `auditLog.a0-remediation-80b5eb80-b531-46d9-9d96-c2f1fc094850`
- Independent read-back: target documents `0`, UAT-marked IDs `0`, logical Articles `39`, duplicate slug groups `0`

Rollback is recoverable from the verified export, but importing a full Production backup is a broad destructive operation and requires separate explicit approval.

## Remaining editorial findings

1. Thirty-four Articles reference an Author that currently exists only as a Draft. Twenty-four reference a Category that currently exists only as a Draft. These resolve in the private Draft view, but must be reconciled before each affected Article is published.
2. Thirty-three Articles have neither a Sanity featured-image asset nor a migrated/original featured-image URL.
3. No reference target is absent entirely and no referenced Portable Text image is broken.

## Complete logical Article register

Issue codes: `A` = Author target is Draft-only, `C` = Category target is Draft-only, `I` = featured image missing.

| Base document ID | State | Slug | Latest Draft/Published update (UTC) | Issues |
|---|---|---|---|---|
| `ccpun-wp-article-267` | Draft only | `aia-critical-illness-insurance-types` | 2026-08-20T04:13:41Z | A, I |
| `ccpun-wp-article-294` | Draft only | `health-insurance-freelancer` | 2026-08-20T04:13:41Z | A, I |
| `ccpun-wp-article-295` | Draft only | `how-to-choose-health-insurance` | 2026-08-20T04:13:41Z | A, I |
| `ccpun-wp-article-296` | Draft only | `first-life-insurance-guide` | 2026-08-18T18:05:42Z | A, C, I |
| `ccpun-wp-article-297` | Draft only | `save-money-instead-of-insurance-is-it-worth-it` | 2026-08-18T18:05:39Z | A, C, I |
| `ccpun-wp-article-298` | Draft only | `critical-illness-financial-planning-guide` | 2026-08-20T04:13:41Z | A, I |
| `ccpun-wp-article-299` | Draft only | `life-insurance-10-million-baht-guide` | 2026-08-18T18:05:39Z | A, C, I |
| `ccpun-wp-article-314` | Draft only | `aia-ci-supercare-guide` | 2026-08-20T04:13:41Z | A, I |
| `ccpun-wp-article-315` | Draft only | `aia-ci-procare-guide` | 2026-08-20T04:13:41Z | A, I |
| `ccpun-wp-article-316` | Draft only | `wp-draft-316` | 2026-08-18T18:05:42Z | A, C, I |
| `ccpun-wp-article-317` | Draft only | `health-insurance-lump-sum-vs-annual-limit` | 2026-08-20T04:13:41Z | A, I |
| `ccpun-wp-article-318` | Draft only | `aia-ci-supercare-vs-ci-procare` | 2026-08-20T04:13:41Z | A, I |
| `ccpun-wp-article-422` | Draft only | `copaymentanddeductible` | 2026-08-20T04:13:41Z | A, I |
| `ccpun-wp-article-468` | Draft only | `ci-planning-how-to` | 2026-08-20T04:13:41Z | A, I |
| `ccpun-wp-article-474` | Draft only | `wp-draft-474` | 2026-08-18T18:05:42Z | A, C, I |
| `ccpun-wp-article-475` | Draft only | `wp-draft-475` | 2026-08-18T18:05:44Z | A, C, I |
| `ccpun-wp-article-476` | Draft only | `wp-draft-476` | 2026-08-18T18:05:44Z | A, C, I |
| `ccpun-wp-article-477` | Draft only | `wp-draft-477` | 2026-08-18T18:05:44Z | A, C, I |
| `ccpun-wp-article-478` | Draft only | `wp-draft-478` | 2026-08-18T18:05:44Z | A, C, I |
| `ccpun-wp-article-479` | Draft only | `wp-draft-479` | 2026-08-18T18:05:44Z | A, C, I |
| `ccpun-wp-article-480` | Draft only | `wp-draft-480` | 2026-08-18T18:05:44Z | A, C, I |
| `ccpun-wp-article-481` | Draft only | `wp-draft-481` | 2026-08-18T18:05:44Z | A, C, I |
| `ccpun-wp-article-482` | Draft only | `wp-draft-482` | 2026-08-18T18:05:44Z | A, C, I |
| `ccpun-wp-article-502` | Draft only | `wp-draft-502` | 2026-08-18T18:05:42Z | A, C, I |
| `ccpun-wp-article-503` | Draft only | `new-health-standard` | 2026-08-18T18:05:36Z | A, C |
| `ccpun-wp-article-507` | Draft only | `wp-draft-507` | 2026-08-18T18:05:39Z | A, C, I |
| `ccpun-wp-article-508` | Draft only | `wp-draft-508` | 2026-08-18T18:05:39Z | A, C, I |
| `ccpun-wp-article-509` | Draft only | `wp-draft-509` | 2026-08-18T18:05:42Z | A, C, I |
| `ccpun-wp-article-510` | Draft only | `wp-draft-510` | 2026-08-18T18:05:39Z | A, C, I |
| `ccpun-wp-article-511` | Draft only | `wp-draft-511` | 2026-08-18T18:05:42Z | A, C, I |
| `ccpun-wp-article-512` | Draft only | `wp-draft-512` | 2026-08-18T18:05:39Z | A, C, I |
| `ccpun-wp-article-513` | Draft only | `wp-draft-513` | 2026-08-18T18:05:36Z | A, C, I |
| `ccpun-wp-article-587` | Draft only | `life-insurance-policy-surrender` | 2026-08-18T18:05:36Z | A, C, I |
| `ccpun-wp-article-588` | Draft only | `senior-life-insurance` | 2026-08-18T18:05:36Z | A, C, I |
| `ccpun-wp-published-196` | Published + Draft | `aia-health-happy-describe` | 2026-08-20T03:00:07Z | — |
| `ccpun-wp-published-233` | Published + Draft | `critical-illness-insurance` | 2026-08-20T03:00:07Z | — |
| `ccpun-wp-published-359` | Published + Draft | `aia-health-ci-hero-guide` | 2026-08-20T03:00:07Z | — |
| `ccpun-wp-published-413` | Published + Draft | `aia-vitality` | 2026-08-20T02:55:17Z | — |
| `ccpun-wp-published-95` | Published + Draft | `financial-pyramid` | 2026-08-20T02:55:24Z | — |

## Evidence method

- Queried Sanity with API version `2023-10-01` and the raw perspective so Published and Draft documents were both visible.
- Removed one leading `drafts.` prefix to build the logical identity set.
- Cross-checked raw Article counts independently with `count(*[_type == "article"])`, Published count, Draft count, and the normalized union.
- Checked duplicate slugs after identity normalization.
- Checked reference targets against both `<id>` and `drafts.<id>` to distinguish truly absent targets from Draft-only targets.
- Checked Sanity featured assets, migrated featured sources, original migration URLs, and referenced Portable Text images.
