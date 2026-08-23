# CCPun Admin & Intelligence Layer — Phase 3 SEO Intelligence

Date: 2026-08-21
Environment: `ccpun-web-lab` / Sanity dataset `uat`
Status: SOL-H1–H3 source implementation complete; provider activation and final xhigh review remain pending

## Delivered

### Deterministic SEO Audit

Server-side audit engine evaluates 20 explainable checks with weighted scoring and severity classification:
- critical
- warning
- opportunity

The audit writes only `seo.auditSnapshot` on the Draft. It does not modify canonical, redirect, noindex or publish state.

Audit output includes:
- score / 100
- passed checks
- critical issues
- warnings
- opportunities
- summary
- per-check reason / current state
- proposal type when a failed check can become a proposal

### Audit UI

Routes:
- `/snt-admin/seo/`
- `/snt-admin/seo/[article-id]/`

The detail page exposes the complete explainable breakdown so the score is not a black box.

### Proposal Generation

Endpoint:
- `POST /api/snt-admin/seo/audit/[id]/proposals/`

Rule-based proposals currently support safe editorial suggestions derived from existing Draft content:
- Search intent fallback

SEO title and Meta description proposals are paused until GSC page + query ownership data can be checked for keyword cannibalization. Editors may still update those fields manually in Studio after review.

Generated suggestions enter `needs-human-review` and must follow the existing Human Review → Approve → Apply to Draft flow.

### Content Readiness (non-scoring)

The SEO detail page also shows an editor-facing readiness panel that does not change the SEO score:
- internal links and legacy redirecting blog URLs
- legacy Facebook CTA count
- source and FAQ counts
- Fact-check / Compliance timestamps
- GEO summary, entities, questions and review completeness
- migrated WordPress images versus native Sanity featured image

This panel is diagnostic only. It never rewrites article body, CTA, canonical, redirect, noindex or publication state.

### WordPress migration parity hardening — 2026-08-21

- The five known migrated articles now have one fail-closed per-slug route/category map.
- Known WordPress article links are rewritten directly to final categorized CCPun URLs while preserving query and hash.
- The generated Article category reference, supporting Category document and `mapping.newUrl` must resolve to the same route; regression coverage enforces the invariant.
- Unknown and external links remain unchanged.
- The legacy exporter now refuses redirected WordPress source pages instead of silently re-exporting the current Next.js site as if it were WordPress.
- The live UAT dataset currently contains two synthetic test Drafts and does not contain the five migrated Published articles.

Production Draft remediation — owner approved 2026-08-21:

- A raw-perspective preflight required all five exact Published/Draft pairs in `kyfxgjnq/production` and refused any identity, count or revision mismatch.
- One revision-guarded transaction changed only four Draft `body` fields: four stale direct `/blog/<slug>/` links now use final categorized URLs and four legacy Facebook Inbox CTAs now use the canonical LINE OA URL/label.
- The fifth Draft was inspected but required no body change. No new internal link was invented without GSC page/query evidence.
- Readback verified five Drafts, zero legacy links/CTAs and zero Published revision/body changes. Human Preview and Publish remain separate owner actions.

### Research Intelligence

Routes:
- `/snt-admin/research/`
- `GET/POST /api/snt-admin/research/`

External research is normalized into `researchSnapshot` and always stored with:
- `trustClass = untrusted-external-data`

Supported normalized provider labels:
- Ubersuggest
- GSC
- SERP
- Manual

Decision update — 2026-08-22:

- Ubersuggest MCP is configured, its tools are exposed, and Tier 1 authentication has been verified.
- Provider quota has not been checked or consumed yet. Do not claim live quota or data availability until the first approved read-only request succeeds.
- The Local Control Plane now has an official MCP client bridge, owner-only OAuth route, strict response normalization, 24-hour snapshot reuse and atomic snapshot/audit persistence. Owner OAuth and the first live keyword acceptance test have not been completed, so live quota and returned values remain unverified.
- Local Production persistence is code-separated behind `SANITY_PRODUCTION_RESEARCH_WRITE_TOKEN`; the provider-side least-privilege token and acceptance test remain pending. UAT credentials are not reused.

### Deterministic GEO checkpoint — 2026-08-22

The server audit now exposes ten explainable GEO/AI-search readiness checks covering answer-first summaries, entities, questions, authorship, sources, FAQ alignment, Fact-check/Compliance, internal links, visible FAQ/schema parity and review freshness. GEO remains separate from the SEO score and is not presented as a ranking or AI-citation guarantee. Automatic GEO prose generation was intentionally not added because deterministic code must not invent regulated financial wording or evidence.

The Phase 3.5 target flow is:

```text
Human action in /snt-admin
→ authenticated server route
→ Ubersuggest MCP
→ validate and normalize
→ Sanity researchSnapshot in uat + atomic auditLog
→ deterministic content-gap / opportunity analysis
→ human review
```

Sanity stores compact normalized snapshots and provenance. Sanity does not execute MCP, and Ubersuggest credentials must never be stored in Sanity documents.

### Content Gap / Opportunity

Research snapshots are compared with article Primary + Secondary keywords in the UAT dataset.

The UI displays:
- Covered keyword
- Content gap
- Opportunity score
- Volume
- Difficulty
- Intent
- SERP count

Opportunity is an internal heuristic based on demand and inverse keyword difficulty. It is not a Google metric and not a ranking prediction.

## End-to-End Evidence

UAT test article:
- `drafts.uat-article-admin-layer`

Audit result:
- Score: `31/100`
- Passed: `6`
- Critical: `2`
- Warnings: `10`
- Opportunities: `2`

Audit-generated proposals:
- SEO title proposal → `needs-human-review`
- Meta description proposal → `needs-human-review`

Research snapshot test:
- keyword: `ทดสอบ admin ccpun`
- provider: `manual`
- volume: `120`
- difficulty: `28`
- intent: `informational`
- trust class: `untrusted-external-data`
- coverage: `Covered`
- internal opportunity score: `45/100`

## Security Boundary

Still blocked:
- AI self-approval
- AI Apply to Draft
- Publish
- Delete content
- Canonical changes
- Redirect changes
- Noindex changes
- DNS changes
- Production deploy/config changes

Deterministic SEO audit may be run by human, AI or system actors because it is analysis-only. Persisted changes are limited to the audit snapshot.

## Foundation Hardening — 2026-08-20

- Auth.js allowlisted sessions are the only in-application Admin identity source; Vercel protection remains an outer perimeter, not an RBAC identity.
- Admin data clients fail closed unless a non-production application environment uses the exact `uat` dataset.
- UAT Studio removes publish, unpublish and delete actions.
- Proposal approval freezes the approved value, type, risk, target and target revision.
- Apply to Draft uses only the frozen approval controls and rejects stale revisions or changed base values.
- Suggestion status transitions, Draft mutation and audit logging use revision-guarded Sanity transactions.
- Research snapshots and persisted SEO audit snapshots commit with their audit logs atomically.
- Legacy proposals that do not contain the hardened approval baseline must be regenerated.

## Current verification

Use the latest dated release checkpoint below for test counts and runtime evidence; older Lab deployment IDs are historical evidence, not the current entry point.

- Stable UAT Control Plane: `https://ccpun-web-v4-1-uat-punniixs-projects.vercel.app/snt-admin/`
- Stable UAT Studio: `https://ccpun-web-v4-1-uat-punniixs-projects.vercel.app/studio/`
- Production remains out of scope for this document and must not be inferred from a passing UAT check.

## 2026-08-22 — UAT post-Apply Admin and Preview QA

- Safari read-back on exact `ccb9lnw5/uat` confirmed the Admin shows two Drafts, the applied `personal-finance` category, tags, saved SEO audits and publication dates. Category/tag filtering returned the exact intended row.
- Both owner-only Preview actions opened the final `personal-finance` URLs and rendered with `noindex,nofollow`; no Preview route reached Production.
- An incomplete image block and blank legacy FAQ item in a UAT Draft previously caused Preview validation to return 500. The renderer now omits only incomplete Draft display items, preserving complete content and preventing a partial Studio edit from taking down Preview.
- Verification: Admin tests `83/83`, Vercel-native regression, ESLint, Webpack build and diff check passed. The native Turbopack build is not used as evidence here because the local runtime denied its required temporary port.

## Next Gate

### Local Production foundation (Mac-first)

- Read-only lane: `local:production:read` maps only to `kyfxgjnq/production`; all mutations and Studio are denied.
- Draft lane: `local:production:draft` is an explicit switch for existing Draft editing. It does not expose Publish/Delete/New document actions.
- Google Login is owner-only and the server listens on `127.0.0.1:3000` while accepting the exact browser host `localhost:3000`.
- Production-specific Sanity read/write credentials are separate from UAT and are never used as fallbacks.

Start Phase 3.5 on the Local Mac-first track only after:

1. F1.5 is complete: one fail-closed lane/dataset invariant covers Admin, Sanity reads/Live, CLI and Studio; Lab/UAT now use the separate Non-Production Sanity project `ccb9lnw5/uat`, while Production remains `kyfxgjnq/production`;
2. F2 is complete: Google OAuth/Auth.js values are Sensitive and Preview-only on the protected Lab deployment;
3. F3 is complete: Login, RBAC, Approve, Apply to Draft and Studio Preview passed end to end in Lab against dataset `uat`;
4. F4–F6 are complete: F4 private-surface UX QA, F5 independent `gpt-5.6-sol / xhigh` SECURE verdict for the Lab code boundary, and F6 verified source checkpoint;
5. R1 promotes the exact accepted commit to `ccpun-web-v4-1-uat` and passes the same workflow against Sanity `uat`;
6. A0 reconciles every Sanity `production` Published/Draft Article by normalized document identity with no mutation or UAT import;
7. the loopback-only Local Production Draft lane passes owner authentication, Draft/Preview and fail-closed environment checks without a Production write-token fallback;
8. the Ubersuggest connector batch has explicit provider scope, quota, validation, freshness, idempotency and audit-log acceptance criteria.

After those gates, Phase 3.5 implements the Ubersuggest MCP → normalized `researchSnapshot` → atomic `auditLog` flow in Local UAT first, then promotes the accepted workflow to the Local Production Draft lane through a separately approved least-privilege persistence boundary. Phase 3.6 adds deterministic GEO audits/proposals with human review and no citation/ranking guarantee.

Vercel Pro and `admin.ccpun.com` are not dependencies for Phase 3.5, Phase 3.6 or Phase 4. They remain a deferred cloud migration for always-on and multi-device access after the Local workflow is accepted.

After Phase 3.5 and Phase 3.6 acceptance, Phase 4 may begin with:

Phase 4 — Growth Dashboard:
- Google Search Console
- GA4
- Vercel metrics
- Website health
- Traffic
- Conversion
- Search opportunities

Phase 4 runtime will not use Gemma 4 or another hosted LLM. The first version remains deterministic and explainable. Ubersuggest MCP supplies untrusted external signals only; it cannot approve, Apply to Draft or publish. See `phase-4-growth-dashboard.md` for the staged implementation plan.

## 2026-08-22 WordPress mapping remediation

- The exporter and both migration paths now preserve Rank Math focus keywords and an explicit content-update timestamp.
- Public `dateModified` prefers the content timestamp, then the WordPress source timestamp, so SEO audits and workflow writes do not pretend the article content changed.
- Existing Production WordPress article Drafts were updated in place with revision guards and one atomic audit record. Article count stayed 39; nothing was published.
- Read-back is idempotent: 5/5 migrated published-article Drafts have a primary keyword, recoverable FAQ is structured, and a second dry-run reports zero changes.
- The article renderer now provides a deterministic H2 table of contents, default social image metadata, Twitter metadata and a Financial Health Check CTA without duplicating WordPress-only plugin behavior.
- Google index status remains an external Search Console decision. No indexing request, Production deploy, canonical, redirect, noindex or DNS mutation occurred in this remediation. Any future Search Console connection must use an explicitly approved direct official integration.

## 2026-08-22 UAT taxonomy foundation

- One shared taxonomy contract now limits new Article category selection to `personal-finance`, `life-insurance` and `investment`.
- Legacy health and critical-illness category signals normalize to `life-insurance` while preserving `ประกันสุขภาพ` and `ประกันโรคร้ายแรง` as deduplicated tags.
- Studio hides raw Category management and category creation, but preserves existing Category documents and the three active reference choices.
- The Admin Content page shows article tags and provides server-rendered category/tag filters without adding a second taxonomy store.
- The UAT migration is fail-closed to `ccb9lnw5/uat`, defaults to dry-run, patches Drafts only with revision guards, and writes one atomic audit record only when a later explicitly approved `--apply` is run.
- WordPress import/preparation paths use the shared taxonomy contract and preserve migration provenance; no Article, Category or tag data was duplicated in this implementation run.
- The read-only provider dry-run passed against the exact isolated data plane `ccb9lnw5/uat`: two logical Drafts, zero published documents, three deterministic missing category documents and two Draft category-reference changes planned; `mutationAttempted` remained `false`.
- Safari QA on the real Local UAT Admin confirmed the `uat` lane, two Drafts, saved SEO scores, first-published status, category/tag filters and a clean browser console. UAT remained `noindex` and its Draft-only blog sitemap remained empty.
- Legacy category landings now return permanent redirects to the matching tag-filter view, legacy article categories resolve to the final `life-insurance` path, explicit canonicals must exactly match the final CCPun URL, and canonically misaligned articles are excluded from the sitemap and marked `noindex`. The two legacy category slugs are reserved in Studio to prevent future route collisions.
- Verification passed: Admin `83/83`, CMS migration safety `23/23`, WordPress migration parity, Vercel regression, ESLint, TypeScript, Sanity schema `0/0` and Webpack production build.
- The owner-approved UAT apply completed as one transaction: three active Category documents were created, two UAT Draft category references were updated, and one UAT audit record was written. Immediate read-back confirmed zero Published articles and the post-apply dry-run reported zero remaining changes.
- No Production content mutation, Publish, Production deploy or DNS action occurred.

Next gate: repeat Admin and Preview QA against the applied UAT data. Production taxonomy/content and redirect release remain a separate approval-gated cutover.

## 2026-08-22 UAT release security checkpoint

- Adversarial review found no remaining P0 or P1 issue in the release candidate.
- Published content parsing remains strict and fails closed; only incomplete Draft display items may be omitted while an editor is working.
- The UAT taxonomy migration rejects deterministic-ID collisions and conflicting category signals rather than choosing a route silently.
- First-deployment Safari QA caught a Sanity Structure root list whose Thai title could not infer a web-safe ID. The root now has the explicit ID `content`, and unidentified child items are also dropped before the list is built; regression tests cover both conditions.
- Studio Structure and create-new choices expose only owner content types; system-managed suggestions, research snapshots, audit logs and raw Category management remain hidden, read-only and actionless.
- Draft migrations remain revision-guarded, atomic and limited to `ccb9lnw5/uat`; Publish, delete and Production mutations remain unavailable.
- Verification passed: Admin `84/84`, CMS migration safety `23/23`, WordPress migration parity, Vercel regression, ESLint, TypeScript, Sanity schema `0/0`, production dependency audit `0` vulnerabilities and Webpack production build.

Security verdict: **SECURE for UAT Preview deployment**, subject to post-deploy confirmation that Vercel is bound to the UAT project and `uat` dataset. No Production deploy, content publish, DNS or Production data mutation is included in this release.

## 2026-08-22 SOL-H1–H3 adversarial connector gate

- The independent `gpt-5.6-sol / xhigh` review found no P0. Two P1 findings were fixed before activation: OAuth discovery/redirect trust and provider-quota authorization.
- Ubersuggest now accepts only its pinned HTTPS origin, rejects private/link-local DNS answers and cross-origin redirects, and validates discovered issuer/authorization/token/registration endpoints before persistence.
- Provider queries use an owner-only permission, one concurrent provider request and a six-per-minute rolling limit with server-side `429 Retry-After`.
- GEO v2 now requires matching visible FAQ questions and rejects future-dated review timestamps.
- Verification passed: Admin `99/99`, TypeScript, ESLint, Vercel-native regression, Sanity schema `0/0`, Webpack production build, diff check and production dependency audit with `0` vulnerabilities.

Security verdict: **SAFE TO PROCEED with owner-controlled Local UAT runtime acceptance**. Actual OAuth metadata/token scope, first keyword result and provider quota remain runtime evidence. No provider authentication, keyword request, Sanity mutation, deploy, Publish, DNS or Production change occurred in this gate.
