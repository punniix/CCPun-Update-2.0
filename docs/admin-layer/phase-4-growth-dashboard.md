# CCPun Admin & Intelligence Layer — Continuation Roadmap to Phase 4

> **Historical deployment record:** references to `ccpun-web-lab` and `ccpun-web-v4-1-uat` describe the former rollout. Both Projects are now `LEGACY-FROZEN`; do not execute their deploy/alias instructions. New Admin work uses a protected branch Preview inside the Admin survivor.

Date: 2026-08-22
Environment: Lab first / Sanity dataset `uat`
Status: SOL-H1–H3 source implementation complete; owner OAuth/provider activation and final `gpt-5.6-sol / xhigh` review remain pending

## Owner Outcome

Use the verified Local Mac Control Plane to add Ubersuggest research, deterministic SEO/GEO and growth signals without turning the Control Plane into an automatic CMS.

The active owner-use milestone is the loopback-only `CCPun Admin.app`, where the owner can manage real Sanity `production` Drafts through human review, Draft editing and Preview. Publish remains a separate human action. A future `admin.ccpun.com` deployment reuses this accepted workflow for always-on and multi-device access; it does not unlock the SEO/GEO logic.

## Current Architecture Decision — Local First

Two delivery tracks exist and must not be mixed:

| Track | Current role | Vercel Pro dependency |
|---|---|---|
| Local Mac-first | Active path for Ubersuggest UAT, Production Draft research, deterministic SEO/GEO and owner Preview | None |
| `admin.ccpun.com` cloud | Deferred convenience layer for always-on and multi-device access | Required only if this Vercel-hosted commercial path is resumed |

The Local track still uses cloud services when needed: Sanity stores content and normalized snapshots, while Ubersuggest MCP, GSC and GA4 supply external evidence. The Admin application and provider bridge run on the owner's Mac. When the app is closed, live refreshes and scheduled local jobs stop; saved Sanity snapshots remain available.

When Phase 4 is ready, the owner should be able to answer three plain questions:

1. What changed on the website and search channels?
2. Which page or keyword deserves attention first?
3. What should a human review next?

The first version is deterministic. It does not use Gemma 4 or another hosted LLM in the runtime.

## Owner Milestones

| Milestone | Status | What the owner can do |
|---|---|---|
| F1 — Stable Lab entry | Complete | Open one stable protected Lab URL; no real content operations yet |
| F1.5–F6 — Lab foundation | Complete | Safely test login, roles, Draft workflow and owner UX against `uat` |
| R1 — UAT release candidate | Complete | Use the accepted protected UAT candidate against isolated synthetic content |
| Batch 2 — source and integration readiness | Complete in source | Provider provenance is fail-closed; deterministic SEO reads current content blocks; unsafe evidence-free proposals are disabled |
| Local Production Draft lane | Complete | Use the owner-authenticated Mac app to inspect and edit real Drafts without enabling system Publish |
| A2–A7 — `admin.ccpun.com` cloud migration | Deferred | Reuse the accepted Local workflow later for always-on and multi-device access; not required for U1, U2, G1 or D1–D4 |
| U1 — Ubersuggest Local UAT | Source complete; activation pending | Connect the owner account and run the first quota-safe keyword snapshot |
| U2 — Local Production research | Code boundary complete; credential acceptance pending | Persist only normalized research through a separate Production research token |
| G1 — GEO Intelligence | Deterministic audit complete; xhigh pending | Review explainable GEO readiness separately from the SEO score |
| D1–D4 — Growth Dashboard | Read models complete; providers not connected | Connect approved read-only GSC, GA4 and Vercel sources without fabricating missing data |

Practical readiness: the owner can already operate Drafts locally. After U2 the Local system is usable for keyword-led SEO research; after G1 it is usable for SEO + GEO operations; after D4 it has a measurement and prioritization loop. A2–A7 changes where the system runs, not what its intelligence layer can do.

## Recommended Models for Delivery

Reasoning effort below is the model's reasoning setting, not calendar duration or delivery estimate.

| Work item | Model / reasoning effort | Responsible specialist role |
|---|---|---|
| F1 — Stable Lab URL and OAuth callback | `gpt-5.6-sol` / `high` | Software Architect + DevOps |
| F1.5 — Sanity lane and Studio fail-closed boundary | Implementation: `gpt-5.6-sol` / `high`; security review: `gpt-5.6-sol` / `xhigh` | Software Architect + Security Reviewer |
| F2 — Google OAuth, Auth.js Preview env and redeploy | Implementation: `gpt-5.6-sol` / `high`; final security check: `gpt-5.6-sol` / `xhigh` | Senior Developer + Security Reviewer |
| F2.1 — Consent-gated Production GTM insertion | `gpt-5.6-sol` / `high` | Tracking & Measurement Specialist + Senior Developer |
| F3 — Authenticated workflow QA | Workflow: `gpt-5.6-sol` / `high`; owner UX QA: `gpt-5.6-terra` / `high` | Senior Developer + QA Tester |
| F4 — Private Admin UX cleanup | `gpt-5.6-terra` / `high` | UX/UI Designer + Accessibility QA |
| F5 — Lifecycle and security regression | Implementation/test: `gpt-5.6-sol` / `high`; final adversarial review: `gpt-5.6-sol` / `xhigh` | Security Reviewer + QA Tester |
| F6 — Source hygiene and documentation | `gpt-5.6-sol` / `high` | Senior Developer + Technical Writer |
| R1 — UAT release candidate | `gpt-5.6-sol` / `high` | Senior Developer + QA Tester |
| A0 — Production content inventory and identity reconciliation | `gpt-5.6-sol` / `xhigh` | Backend Architect + Security Reviewer |
| A1 — Production Admin architecture and data policy | `gpt-5.6-sol` / `xhigh` | Software Architect + Security Reviewer |
| A2 — Private Production Admin project and runtime | Implementation: `gpt-5.6-sol` / `high`; security review: `gpt-5.6-sol` / `xhigh` | Senior Developer + DevOps + Security Reviewer |
| A3 — Production auth, RBAC and least privilege | `gpt-5.6-sol` / `xhigh` | Security Reviewer + Senior Developer |
| A4 — `admin.ccpun.com` domain and protection | `gpt-5.6-sol` / `high` | DevOps + Security Reviewer |
| A5 — Production Draft rehearsal and owner QA | Workflow: `gpt-5.6-sol` / `high`; owner UX: `gpt-5.6-terra` / `high` | QA Tester + Senior Developer |
| A6 — Editorial Foundation Final Gate | Verification: `gpt-5.6-sol` / `xhigh`; owner action/UX: `gpt-5.6-terra` / `high` | Security Reviewer + QA Tester |
| A7 — Production Admin handoff | `gpt-5.6-terra` / `high` | UX/UI Designer + Technical Writer |
| U1 — Ubersuggest MCP runtime bridge and UAT snapshot | Implementation: `gpt-5.6-sol` / `high`; final security check: `gpt-5.6-sol` / `xhigh` | Backend Architect + Security Reviewer |
| U2 — Promote accepted research workflow to Local Production Drafts | Implementation: `gpt-5.6-sol` / `high`; final security check: `gpt-5.6-sol` / `xhigh` | Backend Architect + Security Reviewer |
| G1 — Deterministic GEO Intelligence | Logic: `gpt-5.6-sol` / `high`; final security/content review: `gpt-5.6-sol` / `xhigh` | GEO Specialist + Security Reviewer |
| D1 — GSC read model | `gpt-5.6-sol` / `high` | Tracking & Measurement Specialist + Senior Developer |
| D2 — GA4 read model | `gpt-5.6-sol` / `high` | Tracking & Measurement Specialist + Analytics Reporter |
| D3 — Vercel health | `gpt-5.6-sol` / `high` | DevOps/SRE + Senior Developer |
| D4 — Owner dashboard and deterministic opportunities | Logic: `gpt-5.6-sol` / `high`; owner UX: `gpt-5.6-terra` / `high` | Analytics Reporter + UX/UI Designer |
| Final architecture/security release gate | `gpt-5.6-sol` / `xhigh` | Software Architect + Security Reviewer + QA Tester |

Do not use `max` or `ultra` for this roadmap. Gemma 4 and other hosted LLMs are not runtime dependencies; deployed behavior remains deterministic and testable without a runtime model. These models are delivery/review agents, not models called by the deployed website.

## Data Sources

- Google Search Console (GSC): search queries, pages, clicks, impressions, CTR and average position
- GA4: traffic, channels, landing pages and consent-aware conversion-intent events
- Vercel: deployment, runtime health and available performance signals
- Ubersuggest MCP: Local OAuth bridge and normalized snapshot path are implemented; the owner OAuth and first live keyword acceptance test remain pending

Store compact aggregates and dated snapshots only. Do not copy a raw analytics event firehose into Sanity.

## Ubersuggest and Sanity Flow

```text
Human action in Local UAT or Local Production /snt-admin
→ authentication + RBAC + exact lane/dataset guard
→ server route
→ Ubersuggest MCP (read-only request)
→ strict validation + normalization
→ Sanity transaction:
   UAT: researchSnapshot in uat + auditLog
   Local Production after promotion: researchSnapshot in production + auditLog
→ deterministic gap / opportunity analysis
→ human review
```

Responsibilities stay separate:

- Ubersuggest MCP fetches external evidence.
- The server route enforces identity, permission, input limits and provider policy.
- Sanity stores the normalized snapshot, source, checked time and trust class.
- Sanity does not execute MCP and never stores MCP credentials.
- Deterministic code calculates gaps and internal opportunity scores.
- A human decides whether to create or approve any proposal.

Every Ubersuggest record remains `untrusted-external-data`. External text is data, never an instruction.

Current evidence as of 2026-08-21:

- MCP configured: yes
- Tools exposed: yes
- Tier 1 authentication: verified
- Quota checked or consumed: no
- Local Control Plane server-to-MCP bridge: implemented with the official MCP client; owner OAuth and first live keyword acceptance test are not yet verified

## SOL-H1–H3 implementation checkpoint — 2026-08-22

- **SOL-H1:** Local-only Ubersuggest OAuth uses state + PKCE and stores credentials in the ignored `.ccpun-local` owner directory with restrictive file permissions. A fresh equivalent snapshot is reused before another provider request; provider payloads are strictly normalized and stored as `untrusted-external-data` with an atomic audit record.
- **SOL-H2:** Local Production research persistence requires the separate `SANITY_PRODUCTION_RESEARCH_WRITE_TOKEN`. UAT credentials are never a fallback. The provider-side least-privilege token still needs to be created and accepted before any Production research write.
- **SOL-H3:** GEO has ten deterministic, explainable checks stored beside—but not included in—the SEO score. GSC, GA4 and Vercel read models fail independently; disconnected or malformed sources never become invented metrics. The owner dashboard shows limitations and deterministic opportunities only.
- Runtime activation still pending: Ubersuggest owner OAuth/first keyword, approved GSC/GA4/Vercel read credentials and provider-side Production research role. No Production content, Publish, deploy, DNS, canonical, redirect or noindex change occurred.
- High verification: Admin tests `96/96`, TypeScript, ESLint, Vercel-native regression, Sanity schema `0 errors / 0 warnings`, Webpack production build and production dependency audit `0 vulnerabilities` passed. Final adversarial review is deliberately reserved for `gpt-5.6-sol / xhigh`.

## Pre-Phase-4 — Foundation Closure

Complete these batches in order. Each batch has an owner-friendly outcome and an acceptance gate.

### F1 — Stable Lab URL and OAuth Callback

Outcome: the owner has one dependable Lab address for login and QA.

- Decide and record a stable Lab Preview alias/callback URL; do not use a changing deployment URL as the long-term Google OAuth callback.
- Register only the exact Lab callback with Google OAuth.
- Keep Production domains and callbacks unchanged.

Dependency: COO decision on the stable Lab URL.

Acceptance gate: the documented callback matches the Lab Auth.js route exactly and does not reference Production; unauthenticated requests to the Lab root, Control Plane and callback are stopped by Vercel Authentication; the authenticated Preview application is configured to return `noindex`; and Admin routes remain absent from public navigation and sitemaps. The platform-generated SSO redirect is not required to repeat an application response header that cannot run before authentication.

#### F1 execution record — 2026-08-21

Status: **Complete — stable protected alias and evidence-bounded noindex contract verified.**

- Vercel scope: `punniixs-projects` (`team_GbcO71LS2dLHwiBV6Cs39Kax`)
- Historical lab Project was retired after parity verification; it is not a deployment target.
- Stable Lab alias: `https://ccpun-web-lab-punniixs-projects.vercel.app`
- Stable Control Plane URL: `https://ccpun-web-lab-punniixs-projects.vercel.app/snt-admin/`
- Exact Auth.js Google callback for future F2: `https://ccpun-web-lab-punniixs-projects.vercel.app/api/auth/callback/google`
- Bound deployment: `dpl_5fXEmbvf4z8C2YJBD7dKjE7mPYhM` / `ccpun-web-pyslamva6-punniixs-projects.vercel.app`
- Deployment read-back: `target=preview`, `READY`, project `ccpun-web-lab`
- Protection read-back: unauthenticated `HEAD /`, `GET /`, `GET /snt-admin/` and `GET /api/auth/callback/google` return HTTP `302` to `https://vercel.com/sso-api`; no login, share link, exception or protection bypass was used.
- Vercel boundary: [Deployment Protection](https://vercel.com/docs/deployment-protection) applies before Routing Middleware/application code. Vercel's [Preview indexing guidance](https://vercel.com/kb/guide/are-vercel-preview-deployment-indexed-by-search-engines) also documents that an assigned non-Production domain omits the automatic Preview `X-Robots-Tag` and recommends framework-level header injection. Therefore the stable alias's SSO `302` omission is expected platform behavior, not evidence that protected application content is indexable.
- Application noindex: the Preview source returns `X-Robots-Tag: noindex, nofollow, noarchive`, emits review metadata with `index: false`, serves `robots.txt` with `Disallow: /`, and gives both Admin login and protected layouts explicit noindex metadata. Regression coverage also verifies `/snt-admin/` is absent from the public Navbar, navigation config and sitemap sources.
- Verification boundary: the authenticated deployed response was not opened because F1 forbids login and protection bypass. Source/config regression plus the protected unauthenticated edge response is the maximum safe evidence in F1; authenticated end-to-end read-back moves to F3.
- Scope confirmation: no source/runtime configuration change, deployment, `--prod`, Production/UAT project, DNS/custom domain, environment, Google OAuth or Sanity mutation was performed. Only a regression test and this roadmap record changed locally. The callback was documented only and was not registered with Google in F1.

Do not disable or weaken Vercel Authentication merely to expose the application `X-Robots-Tag` on an unauthenticated request. The secure contract is: the edge blocks unauthenticated content access; after authentication, the Preview application supplies the noindex controls; Admin discovery paths remain absent from public surfaces.

This manual alias is pinned to the deployment above. Future Lab Preview deployments must explicitly reassign it with `vercel alias set <new-ready-preview-deployment-id> ccpun-web-lab-punniixs-projects.vercel.app --scope punniixs-projects` unless Vercel later confirms automatic tracking. Rollback for F1 is `vercel alias remove ccpun-web-lab-punniixs-projects.vercel.app --scope punniixs-projects`.

### F1.5 — Sanity Lane and Studio Fail-Closed Boundary

Outcome: a configuration mistake cannot turn Lab/UAT Studio or server clients into a Production editor.

- Use one shared environment/dataset invariant across Admin clients, public Sanity reads, Sanity Live, CLI and Studio.
- Allow only `lab|uat|development → uat` and the future dedicated `production-admin → production` mapping.
- Keep public `production` unable to mount the Admin data plane or Studio.
- Refuse to initialize on missing, unknown or mismatched environment/dataset values; never fall back to another dataset.
- Make Studio actions fail closed on unknown/mismatched lanes. Non-Production continues to remove Publish, Unpublish and Delete.
- Decide before implementation whether to create a separate Non-Production Sanity project. The recommended target is separate projects because project-level credential mistakes otherwise remain a residual path to Production.

Dependency: F1.

Acceptance gate: focused tests prove every allowed and denied lane, Lab/UAT Studio cannot initialize against `production`, public Production cannot expose Admin/Studio, and no token or dataset value is printed.

#### F1.5 execution record — 2026-08-21

Status: **Complete — High implementation and `gpt-5.6-sol / xhigh` security review passed locally.**

- One exact lane/dataset invariant now covers Admin clients, public Sanity reads, Sanity Live, image configuration, CLI and Studio.
- Allowed pairs are `development|lab|uat → uat`, `production-admin → production`, and public `production → production` for Published reads only.
- Public `production` cannot initialize the Admin data plane or Studio. Missing, unknown and mismatched values fail closed.
- Lab/UAT Studio keeps Publish, Unpublish and Delete removed. Invalid Studio lanes receive no document actions and cannot initialize.
- Sanity CLI checks both its CLI values and Studio config; `lab → production` exits non-zero without printing the supplied project or dataset value.
- Production analytics now requires the explicit public `production` lane; Admin lanes remain review/noindex environments.
- Verification: Admin tests `24/24`, Vercel-native regression PASS, ESLint PASS, TypeScript PASS, Sanity schema `0 errors / 0 warnings`, Webpack build PASS and production dependency audit `0 vulnerabilities`.
- Scope: local Lab source only. No deploy, Vercel environment, DNS, Sanity token/dataset/content, UAT project or Production project was changed.

The xhigh review found and fixed three concrete gaps:

- Sanity CLI could catch a rejected server lane and continue through a conflicting public Studio lane. Server-side Studio config now requires a known server lane and rejects public/server disagreement; the adversarial `lab + public production-admin + production dataset` probe changed from exit `0` to exit `1`.
- `/studio` and Draft Preview APIs were outside Auth.js/RBAC. Proxy and route/page guards now require an allowlisted session; Studio and Preview require owner-level `draft:apply` permission.
- Production Admin Studio restored Delete with the Production action set. Delete is now removed while Human Publish remains available.

Runtime evidence: unauthenticated local `/studio/` returns `307` to `/snt-admin/login/`; `/api/preview/enable/` and `/api/preview/disable/` return `401`; compiled browser assets contain no Sanity/Auth secret environment names or browser token marker.

Residual promotion gates: the Studio action filter is UI defense only, so Production Admin still requires a separate protected Vercel project, least-privilege Sanity membership and recoverable backups before credentials. Authenticated browser verification remains F3. A separate Non-Production Sanity project remains recommended and requires explicit approval.

### F2 — Google OAuth and Auth.js Preview Environment

Outcome: the approved owner account can reach the CCPun login flow safely.

- Add the approved Google OAuth values as Sensitive Vercel Preview variables.
- Keep the existing Preview owner allowlist; do not broaden it silently.
- Verify key names, type and environment scope without reading values back.
- Redeploy `ccpun-web-lab` Preview because environment changes do not update an existing deployment.

Dependencies: F1, Google Cloud OAuth app and explicit credential-write approval.

Acceptance gate: the new deployment is `target=preview`, `READY`, protected by Vercel SSO and uses only Preview-scoped Auth.js values.

#### F2 execution record — 2026-08-21

Status: **Complete — Google OAuth/Auth.js is configured on the protected Lab Preview.**

- Validated the approved Google Web OAuth credential file in memory, including the exact callback `https://ccpun-web-lab-punniixs-projects.vercel.app/api/auth/callback/google`; no credential value was printed, copied into source or stored in documentation.
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_URL`, `AUTH_SECRET` and `CCPUN_ADMIN_OWNER_EMAILS` are Vercel Sensitive variables scoped to Preview only on `ccpun-web-lab`.
- Auth.js now requires an explicit secure `AUTH_URL`; owner RBAC accepts only a Google identity whose email is verified and exactly allowlisted.
- A Vercel scope-change attempt removed the previously grouped secret. Read-back caught it before authenticated QA; COO authorized rotation, a new cryptographically random `AUTH_SECRET` was generated and transmitted in memory, then the Preview was rebuilt.
- Final deployment: `dpl_9vA8uoFLaWC342iyAjGXCT6ocyKY` / `https://ccpun-web-84foiwgns-punniixs-projects.vercel.app`, `READY`, Preview. Stable alias `https://ccpun-web-lab-punniixs-projects.vercel.app` was reassigned and read back against that deployment.
- Unauthenticated `/`, `/snt-admin/` and the OAuth callback return `302` to Vercel SSO. No protection bypass or Google login was used; authenticated owner workflow verification remains F3.
- Verification: Admin tests `26/26`, Vercel regression, ESLint, TypeScript, Sanity schema `0 errors / 0 warnings`, Webpack build and production dependency audit `0 vulnerabilities` passed.
- Scope: Lab Preview only. No Production/UAT project, DNS, Sanity content/dataset or publish action was changed.

### F2.1 — Consent-Gated Production GTM Insertion

Status: **Complete — explicitly approved Production batch, 2026-08-21.**

- Installed public container `GTM-5DKMGSK3` in the exact clean Production release source and deployed commit `c117bd6a0a1575541aa4deac83aef61b10141606` to `ccpun-web-v4-prod`.
- Uses Google's Basic Consent pattern: the container does not load until Analytics consent is granted. The `noscript` iframe is deliberately omitted because it would contact Google without a JavaScript consent decision.
- GTM remains disabled outside the explicit public Production analytics lane. Existing GA4 and Meta behavior is unchanged.
- Public container inspection at implementation time returned `tags: []`; therefore no GTM-managed tag was firing and no duplicate GA4 tag existed. Any future GTM tag or container publish requires its own Preview, consent, duplication and owner-approval check because GTM can change public tracking without a Vercel deploy.
- Production deployment `dpl_7mHqvXUb764vpnJqHLvBLxZjAaGG` is `READY` and serves `ccpun.com` / `www.ccpun.com`.
- Live browser regression passed `36/36` with Google/Meta endpoints blocked: no pre-consent script/cookie, one GTM load after consent, no duplicate on repeat consent, and script/cookie cleanup after rejection.
- Source validation: Vercel regression, ESLint, TypeScript, native build and production dependency audit passed; Vercel reported no runtime errors in the one-hour verification window.

References: [Google web-container installation](https://support.google.com/tagmanager/answer/14847097?hl=en) and [Basic Consent Mode behavior](https://support.google.com/tagmanager/answer/10000067?hl=en).

### F3 — Authenticated Workflow QA — COMPLETE (2026-08-21)

Outcome: the owner can follow the complete five-step flow without technical help.

- Verify Login and owner identity behind Vercel SSO.
- Verify RBAC using owner and a lower-permission test role where available.
- Run Audit → Generate Proposal → Human Approve → Apply to Draft → Studio Preview.
- Confirm approval does not apply, Apply to Draft does not publish, and Studio Preview remains a separate human check.
- Verify stale/conflicting proposals fail with a friendly next action.

Dependencies: F2 and a disposable UAT Draft.

Acceptance gate: the workflow passes end to end in Lab and creates the expected atomic audit records in Sanity `uat` only.

Completion evidence:

- The owner authenticated through Auth.js and completed Audit → Generate Proposal → Human Approve → Apply to Draft for SEO title and meta description on `drafts.uat-article-admin-layer`; AI/system did not approve, apply or publish.
- Sanity Studio host/CORS registration was verified for the stable Lab origin. Sanity's Vercel provider looped to the project dashboard without returning a Studio token, while Google authentication returned a valid Studio session; non-production Studio now exposes only Google auth and redirects when it is the sole provider.
- Studio read-back confirmed the approved SEO values in dataset `uat`. Presentation loaded the exact Draft article route with the Draft UAT/noindex marker.
- UAT Studio still removes Publish, Unpublish and Delete. Runtime QA found Scheduled Publishing remained available outside the document-action filter; the config now disables both scheduled drafts and scheduled publishing outside `production-admin`.
- Stale proposal conflicts fail closed with a Thai recovery action, and Studio links open in a separate tab for human preview.
- Admin tests `28/28`, Vercel regression, ESLint, TypeScript, Lab guard, Webpack fallback build and Vercel-native Preview build passed. Preview `dpl_FX9LF9Zw3ZNHGFVpVD7Ds57qmwZ2` is `READY`; the stable Lab alias points to it.

Boundary: mutations were limited to the disposable Sanity `uat` workflow and Lab Preview. No Sanity `production` content, Production deployment, DNS or public Publish action was changed.

### F4 — Private Admin UX Cleanup

Outcome: the private admin feels focused and does not show public-site controls that do not belong there.

Status: **Complete on 2026-08-21 — private-surface isolation and responsive QA passed in Lab.**

- `/snt-admin` and `/studio` do not mount public Cookie Consent, Google Analytics or Meta Pixel widgets; public routes keep their existing consent behavior.
- Admin and Studio have explicit `X-Robots-Tag: noindex, nofollow, noarchive`; root metadata, robots and sitemap exclusion remain covered.
- One root skip link remains; the duplicate protected-layout link was removed. Tables retain an accessible horizontal-scroll region and show their scroll cue through widths below `1280px`.
- Local browser QA at `390`, `820` and `1440px` found no Admin cookie dialog or horizontal overflow; an isolated public browser profile still showed the public cookie dialog at `390px` with no overflow.
- `test:vercel`, ESLint, TypeScript, Sanity schema (`0` errors / `0` warnings), Admin tests (`35/35`) and the Lab Webpack build passed.

Boundary: no deploy, Vercel environment change, Sanity mutation, DNS change or public publish action occurred.

- Confirm the public cookie banner does not obstruct or confuse `/snt-admin`; preserve consent behavior on public routes.
- Confirm Admin routes remain authenticated, noindex and absent from public navigation/sitemaps.
- Verify Thai error/loading states, keyboard focus, mobile navigation and table scrolling.

Dependency: F3 browser session.

Acceptance gate: passed locally. R1 repeats this evidence on the UAT deployment.

### F5 — Lifecycle and Security Regression

Outcome: old test data cannot bypass the hardened proposal rules.

Status: **Complete on 2026-08-21. Independent `gpt-5.6-sol / xhigh` verdict: SECURE for the F5 Lab code boundary.**

- Regenerate legacy proposals if they lack frozen approval fields or revision baselines.
- Re-run RBAC, fail-closed dataset, Studio action, proposal lifecycle, atomic audit and JSON-LD security tests.
- Verify no AI/system actor can approve, Apply to Draft or publish.

Dependency: F3 reveals whether legacy proposals remain.

Acceptance gate: all security/policy tests pass and the Review Queue contains only compatible proposals.

Final evidence:

- Added an exact same-origin guard for every non-read `/api/snt-admin` request; missing, malformed or foreign origins fail closed before mutation authorization.
- Approval/apply schemas now reject invalid risk levels, proposal types and target IDs. Review UI uses the frozen approved risk/target/type instead of mutable proposal controls.
- Review Queue now contains only current `needs-human-review` or complete/current `approved` proposals. Applied/stale legacy records remain in Sanity/audit history and are not deleted or actionable.
- Added explicit system-actor deny coverage for Approve, Apply to Draft and Publish.
- Human-only approval/apply is enforced again at the Sanity mutation service. Draft Preview now requires an exact mutable application lane and dataset pair; a public `production` lane cannot read Production Drafts even on a Vercel Preview.
- Persisted audits and generated proposals are bound to the source revision and fail closed on concurrent edits. Published-only rows ask the owner to start a Draft in Studio instead of creating one implicitly.
- Studio system documents are view-only with no document actions. Scheduled Publish, Delete and Unpublish remain outside the normal workflow. Studio displays the timestamped server audit snapshot rather than recomputing a conflicting score.
- The legacy Production publish script is hard-disabled. The remaining historical importer requires both explicit UAT mode and dataset `uat` before reading its input or opening a Sanity client.
- Admin tests `35/35`, Vercel regression, ESLint, TypeScript, Sanity schema `0/0`, Webpack fallback build, Vercel-native Preview build and production dependency audit `0 vulnerabilities` passed.
- Deployed missing-origin mutation probe returned `403`; same-origin without Auth.js returned `401`; both included `X-Robots-Tag: noindex, nofollow, noarchive`.
- Safari runtime read-back on dataset `uat` showed `0` actionable proposals, a single timestamped SEO score (`46/100`) in both Control Plane and Studio, and no UAT Publish action. Stable Lab alias points to Preview `dpl_2DLkBKJ7xJquK2m6BXfxC2UkSn6B` (`READY`).

Boundary: no legacy Sanity document was deleted or rewritten, and no Sanity `production`, Production deployment, DNS or public Publish action was touched. Direct Studio edits/Human Publish use Sanity History rather than the Control Plane audit log; F6/A1 must document and verify this dual audit authority, retention and access before Production Admin.

### F6 — Source Hygiene and Documentation

Outcome: the next developer can change the system without guessing which files are current.

Status: **Complete on 2026-08-21 — documentation reconciled and the verified Lab source recorded as one scoped local commit.**

- Review the Lab worktree and separate Website 4.1 source changes from unrelated user work.
- Commit the verified Website 4.1 Lab source to its Lab branch with no generated cache or secret files.
- Reconcile README, environment boundary, Phase 3 and this continuation roadmap.
- Record exact checks, remaining external dependencies and no-Production boundary.

Dependencies: F1–F5 complete.

Acceptance gate: clean scoped diff/commit, consistent docs and a reproducible Lab verification list. Commit does not authorize Production deploy.

Checkpoint boundary:

- Include only the Website 4.1 Lab source, tests, scripts and Admin documentation in this repository.
- Exclude `.env*`, OAuth JSON, tokens, `.vercel/`, `.next/`, `node_modules/`, TypeScript caches and local QA artifacts.
- `/snt-admin/audit` and Sanity History are documented as separate audit authorities; provider retention/access and backups remain a Production Admin gate.
- F6 performs no push, deployment, Vercel environment change, Sanity mutation, DNS change or publication.

Verification record:

- Source inventory: every changed path belongs to `Dev/Homepage`; ignored `.env*`, `.vercel/`, `.next/`, `node_modules/`, generated Next/TypeScript files and local QA artifacts are outside the commit.
- An unreferenced synthetic `uat-seed-content.json` was excluded from the repository and preserved temporarily outside the worktree; the fail-closed UAT seed script remains the canonical executable fixture.
- Admin tests `35/35`, Vercel regression, TypeScript, ESLint, Sanity schema `0/0`, Lab project guard, Webpack production build, changed-script syntax checks and `git diff --check` passed.
- Production dependency audit reported `0 vulnerabilities`. Analytics tracking QA was not forced because it requires real Analytics IDs and is outside this source-hygiene batch.

## Release Candidate — UAT

### R1 — Promote the Verified Foundation to `ccpun-web-v4-1-uat`

Outcome: the exact candidate intended for Production Admin passes on a separate UAT project before any Production connection.

- Deploy only the verified Lab commit to `ccpun-web-v4-1-uat`.
- Keep `CCPUN_APP_ENV=uat` and Sanity dataset `uat` with project-specific Sensitive credentials.
- Verify authentication, RBAC, Audit → Proposal → Approve → Apply to Draft → Preview, Studio policy, noindex and audit history.
- Use synthetic UAT content only; do not copy or mutate Production automatically.

Dependencies: F1–F6 complete.

Acceptance gate: UAT passes the same build/security/workflow suite as Lab, the deployed commit is recorded, and no Production system changed.

#### R1 execution record — 2026-08-21

- Accepted source commit: `eba3030f3f6e7cde1a62564a566ff3ecafaa4d49`.
- UAT Preview: `dpl_A9j2mwTZEN9AYos6LXymPbANVR5j` (`READY`) at the stable protected entry `https://ccpun-web-v4-1-uat-punniixs-projects.vercel.app`.
- Lab Preview: `dpl_EVm4fEcChsxrb9FBWBNCZtPxE2ai` (`READY`) at the stable protected entry `https://ccpun-web-lab-punniixs-projects.vercel.app`.
- Lab and UAT read/write only `ccb9lnw5/uat`; the real Production project/dataset remains `kyfxgjnq/production` and was not read or changed.
- Owner login, RBAC, Audit → Proposal → Human Approve → Human Apply to Draft, request-ID audit history, Studio editing and Draft Preview passed with synthetic document `drafts.uat-r1-review-check`. The Draft remained `noindex, nofollow` and no Published document was created.
- R1 found and fixed two runtime-only gaps: trailing-slash-safe Studio structure links and a safe Draft-preview fallback when SEO title/meta description are not written yet. Published articles keep strict required-SEO validation.
- Local gates passed: Admin `35/35`, Sanity schema `0/0`, Vercel regression, ESLint, TypeScript and production dependency audit `0 vulnerabilities`; both Vercel-native Preview builds passed.
- The temporary Presentation Draft Mode session was disabled and all Presentation tabs were closed after QA. No Production deployment, Production Sanity mutation, DNS change or content Publish occurred.

## Optional Cloud Production Admin — Deferred Convenience Layer

The A2–A7 plan below is retained as the future `admin.ccpun.com` migration checklist. It is no longer a dependency for Local U1–U2, G1 or D1–D4. Resume it only when the owner wants always-on or multi-device access and approves the commercial hosting, credentials and DNS changes.

### Architecture Decision

**Decision:** use a separate Vercel project for the private Production Control Plane. Do not add the working CMS as a normal public route on `ccpun-web-v4-prod`.

Target topology:

```text
ccpun.com / www.ccpun.com
→ ccpun-web-v4-prod
→ Published perspective only
→ Sanity production

admin.ccpun.com
→ dedicated project: ccpun-admin-prod (created, currently paused)
→ Google/Auth.js + RBAC + exact-origin/host gate
→ Draft/Review/Preview operations
→ Sanity production
→ Human Publish in private Studio only
```

Why this option: it creates a clear deployment, credential and access boundary while preserving one maintainable codebase. The cost is one additional Vercel project, environment set and promotion step. Reusing `ccpun-web-v4-prod` would be simpler operationally but couples public traffic to editorial authentication and increases accidental exposure/configuration risk.

#### Migration-ready contract from Local Production — 2026-08-23

This is a runtime migration, not a CMS or content migration. The accepted Local Production application, schemas and workflow remain the source; `admin.ccpun.com` runs the same reviewed commit against the same Sanity `kyfxgjnq/production` dataset. Articles, Draft overlays, Sanity assets, document IDs and audit records must not be copied into a second database.

| Boundary | Local Production now | Future Cloud Admin | Migration rule |
|---|---|---|---|
| Application | `http://localhost:3000` on the owner's Mac | dedicated `ccpun-admin-prod` deployment | promote one accepted commit; do not fork a second CMS |
| Content | `kyfxgjnq/production` | the same exact project/dataset | reconcile by document ID; never import or duplicate content |
| Media | Sanity assets plus temporary migrated-image fallbacks | the same Sanity assets | normalize migrated featured images before or independently of cloud cutover |
| Authentication | local Google/Auth.js owner login | dedicated Production Admin OAuth client, exact callback and unique `AUTH_SECRET` | require verified email, owner allowlist and Google 2-Step Verification; never reuse UAT secrets |
| Credentials | owner-only local configuration | project-scoped Sensitive Vercel variables | create new least-privilege cloud credentials; never copy `.env.local` or reuse Lab/UAT tokens |
| Browser data access | exact `http://localhost:3000` Sanity CORS | exact `https://admin.ccpun.com` Sanity CORS | credentials allowed only for exact approved origins; no wildcard |
| Public surface | loopback only | internet-reachable but application-authenticated | all Admin pages/APIs/Studio remain noindex and fail closed before data access |
| Rollback | stop the local app | pause Admin deployment, remove domain/CORS and revoke cloud-only credentials | Local Production remains the operational fallback; content rollback stays revision/backup based |

Resume conditions: the owner needs always-on or multi-device access, approves commercial Vercel hosting, and separately approves Production credentials plus the `admin.ccpun.com` DNS change. Vercel Standard Protection remains useful for Preview/generated URLs, while the Production hostname uses the established Google/Auth.js application perimeter. Advanced Deployment Protection is optional and should be purchased only if a future threat model requires a second platform perimeter.

Cloud launch order remains A2–A7 below. Start read-only, prove the exact project/dataset and identity boundary, then enable one Draft capability at a time. The first owner rehearsal must use one named Draft and must not publish. The first Human Publish is a later explicit A6 action with before/after read-back and rollback evidence.

### A0 — Production Content Inventory and Identity Reconciliation

Outcome: every Article in Sanity `production` appears exactly once in the Production Admin, whether it is Published-only, Published with Draft changes, or Draft-only.

- Read the existing Sanity `production` dataset directly; do not copy Production articles into a second Admin database and do not import UAT test content.
- Build one read-only reconciliation grouped by normalized base document ID so `article-id` and `drafts.article-id` never appear as duplicate articles.
- Classify each row as `Published`, `Published + Draft changes`, or `Draft only` and show the last update time.
- Reconcile the complete result set against raw Production counts with pagination; no silent row limit is allowed.
- Report orphan Drafts, duplicate slugs, missing categories/authors/assets and broken references before enabling editing.
- Preserve document IDs, slugs, references, images, Portable Text and SEO fields; no automatic rewrite or normalization during inventory.

Dependency: R1 accepted and explicit read-only Sanity Production access approval.

Acceptance gate: the unique Admin article count equals the normalized union of raw Published and Draft Article IDs; every discrepancy is listed, no document is changed, and UAT-only documents are absent.

### A1 — Production Admin Policy and Data Plane

Outcome: Production content access is intentional and cannot be enabled by changing only a dataset string.

- Add an explicit `production-admin` application lane distinct from public `production`.
- Permit `production-admin → production` only on the dedicated private project; keep `production → production` Published-only and Admin-disabled.
- Keep Control Plane Publish, Delete, Canonical, Redirect, Noindex, DNS and deploy actions hard denied.
- Require Draft IDs, revision/current-value checks, frozen approvals, atomic transactions, server-generated request IDs and audit logs for every supported Draft mutation.
- Use least-privilege project-specific credentials; never reuse Lab/UAT tokens or expose tokens to the browser.
- Treat direct Studio Human Publish as a separate Sanity-authenticated action recorded in Sanity history, not as an Admin API capability.

Dependencies: A0 accepted and explicit approval for Production code/config preparation.

Acceptance gate: tests prove public Production cannot access Admin clients, Lab/UAT cannot access `production`, and only the dedicated Production Admin lane can perform whitelisted Draft mutations.

### A2 — Create and Protect the Private Vercel Project

Outcome: the Production Admin has its own deployment and credential boundary.

- Create the proposed `ccpun-admin-prod` project only after explicit approval.
- Keep Vercel Standard Protection on Preview/generated deployment URLs; protect the Production Admin hostname with the exact-origin Google/Auth.js application perimeter selected by A2 xhigh.
- Configure Sensitive Production Admin environment values without reading or printing secrets.
- Deploy the exact UAT-accepted commit; never use the public Production project as the deployment target.
- Verify Ready state, project ID, commit, protection and noindex before any authenticated data check.

Dependency: A1.

Acceptance gate: unauthenticated requests cannot reach content or protected APIs, every Admin-host response is noindex, and configuration read-back proves the correct project/lane/origin without exposing values.

#### A2 high implementation record — 2026-08-21

Status: **Implemented and safety-stopped; not accepted and not available for owner use.**

- Current source commit `8f823686fa617f140161cc8d741eb8dd0769655d` first passed a fresh UAT Preview build: `dpl_GEWu9LQLoER8aBGcw4BsnkwRKZp5` (`READY`) on `ccpun-web-v4-1-uat`.
- Created dedicated Vercel project `ccpun-admin-prod` (`prj_6tuUxJxYbQ4mpF7sMgNWx2p2jowN`), enabled Vercel Authentication before data credentials, enabled system environment identity, and bound the `production-admin` lane to this exact Project ID.
- Added only non-secret Production/Preview configuration for `production-admin → kyfxgjnq/production`, with public analytics disabled. No Auth.js, Google OAuth or Sanity token was added and no Sanity Production content was read or mutated.
- Exact-commit artifact `dpl_2Q8idkv8AQB1cDniVPsfcnW5an8H` reached `READY`; its generated deployment URL was protected and noindex. Two later deployments remained `UNKNOWN` without build output and are recorded as non-candidates.
- Vercel rejected `All Deployments` protection with HTTP `428` because the current plan does not support Vercel Authentication for Production deployments. Standard Protection left the Production alias publicly reachable, so the project was paused immediately after explicit owner confirmation.
- Final read-back: project `paused=true`; `https://ccpun-admin-prod.vercel.app/` returns `503 DEPLOYMENT_PAUSED`; `https://ccpun.com/` remains `200`. No public Production project, DNS/domain mapping, Sanity content or Publish action changed.

This high-pass safety stop is superseded by the xhigh decision below. The project remains paused and A3 credentials remain absent until the selected application perimeter and commercial-plan gate are completed.

#### A2 xhigh security decision — 2026-08-21

Status: **Decision and Lab code hardening complete; the paused runtime is not yet accepted or usable.**

The selected Production perimeter is one owner-facing Google/Auth.js login, followed by server-side RBAC, hard-deny policy, exact Project ID/dataset binding and least-privilege Sanity access. It deliberately does not add a second Vercel or Cloudflare login.

- Live Vercel API read-back identifies the current workspace as `Hobby`. Vercel restricts Hobby to personal/non-commercial use, so the CCPun workspace requires an explicitly approved Pro upgrade before Production Admin activation.
- Vercel `All Deployments` would require the Pro Advanced Deployment Protection add-on, currently documented at USD 150/month. It is not justified for this small owner-only application and was not purchased.
- Cloudflare Access can cover a small team without that add-on, but safe use requires DNS proxying plus origin JWT validation to prevent direct-origin bypass. Keeping Auth.js would still create two login layers; replacing Auth.js would rewrite the established identity/audit contract. It is deferred, not installed.
- The application now matches every request on `ccpun-admin-prod.vercel.app` and future `admin.ccpun.com`. Only Auth.js endpoints, the login bootstrap, `robots.txt` and required framework assets are reachable before login; other pages redirect to login and APIs return `401`.
- Production Admin requests must use the exact configured `AUTH_URL` origin. A mismatched alias, scheme, port or malformed URL returns `404` before content access.
- `production-admin` always emits review/noindex behavior even when the Vercel Project ID is missing or mismatched; the data plane continues to fail closed independently.
- Public `ccpun.com` remains outside the new host-scoped matcher. Existing route-level permission checks, same-origin mutation checks and human-only policy remain required behind the perimeter.

References: [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection), [Vercel Hobby plan](https://vercel.com/docs/plans/hobby), [Vercel Terms](https://vercel.com/legal/terms), [Cloudflare Access](https://www.cloudflare.com/sase/products/access/) and [Cloudflare Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/).

The security layers are now intentionally non-duplicative: Google/Auth.js proves the human identity once; RBAC and policy authorize each action; exact environment/project/dataset guards contain configuration errors; Sanity credentials constrain the data plane; audit/revision checks protect the workflow. A second edge identity provider may be added later only if the threat model, team size or compliance requirement changes.

### L1–L5 — Local Mac UAT before Production

Status: **Complete and owner-verified in Local UAT. Production-local creation remains a separate deferred gate.**

- **L1 Local runtime:** `npm run local:uat` binds the existing application to loopback `127.0.0.1`, serves it at `http://localhost:3100` and labels it `Local UAT บน Mac`.
- **L2 Data boundary:** all Admin, Studio and public Sanity clients now require the exact application lane, project and dataset. Local UAT accepts only `ccb9lnw5/uat`; `kyfxgjnq/production` fails closed.
- **L3 Authentication:** Auth.js, verified Google identity and the owner allowlist remain mandatory. The OAuth client must add `http://localhost:3100/api/auth/callback/google`; credentials stay only in local ignored configuration. Local UAT uses a cookie namespace separate from Local Production.
- **L4 Real UAT workflow:** owner login and Content → SEO audit → Proposal → Human Approve → Apply to UAT Draft → Studio Preview were verified with Sanity and audit-log readback. UAT Publish/Delete/Unpublish/scheduled publishing remain blocked.
- **L5 verification:** Admin policy `40/40`, Vercel-native regression, ESLint, TypeScript, Sanity schema `0/0`, production dependency audit `0 vulnerabilities`, a Vercel-native build pass and authenticated Safari QA pass.

Owner decision: finish the complete UAT workflow first. Only after L1–L5 acceptance may a separate Local Production lane be created; no `local:production` command or Production credential/data access exists in this batch.

#### Local Production Draft activation — 2026-08-22

Status: **Implemented with human Studio authentication and owner-controlled editorial actions; live-action acceptance remains.**

- `local:production:draft` enables the Article Studio lane on loopback. Google/Auth.js owner authentication remains mandatory before `/studio/` can load.
- No Sanity Editor API token was created. The built-in Editor token can write broadly across the Production dataset, so it is not an acceptable Draft-only server credential.
- Local Production Studio lets the owner create Articles, autosave Draft edits, Preview, Human Publish, Unpublish and use Sanity Scheduled Drafts. Permanent Delete is available only after no Published version remains; Duplicate and non-Article document actions stay unavailable.
- Control Plane and AI/system policy still hard-deny Publish/Delete. The editorial actions execute only in the signed-in human's native Sanity Studio session and use Sanity History as their audit source.
- The Control Plane still has no Production write token, reports automated Apply as unavailable and cannot approve, generate, audit or Apply Production proposals in this mode.
- Admin status now distinguishes human Studio Draft editing from Control Plane Apply readiness so the owner is not told that all Draft editing is disabled.
- Verification (2026-08-23): Admin `102/102`, focused Studio policy `6/6`, Vercel regression, ESLint, TypeScript, Sanity schema `0/0`, Webpack build and production dependency audit pass. No Production document, deployment, DNS, canonical, redirect or noindex state was changed. The owner must still perform a named Draft-only rehearsal before using Publish/Unpublish/Delete/Schedule on real content.

The Sanity Contributor role was evaluated because Sanity documents it as Draft-only. It was not used as the server token: the current atomic Apply workflow must also update proposal state and create an audit document, which are not Draft article writes. Treating Contributor as fully write-ready would create a false readiness signal. Reference: [Sanity roles and permissions](https://www.sanity.io/docs/content-lake/roles-concepts).

### A3 — Production Authentication, RBAC and Studio Policy

Outcome: only approved people can operate real Drafts, with different permissions for viewing, reviewing and applying.

- Configure Google OAuth callback for the private Admin host and keep a narrow owner/role allowlist.
- Require one verified Google/Auth.js identity and server-side RBAC on every protected request; Vercel Standard Protection remains defense-in-depth for Preview and generated deployment URLs, not a second Production login.
- Before activation, move the commercial workspace off Hobby and confirm Google 2-Step Verification on every allowlisted Production Admin account.
- Verify owner, editor/reviewer and viewer permissions with separate test identities where available.
- Keep Control Plane publish/delete disabled. In private Production Studio, Human Publish is available only after Draft Preview; Delete and Unpublish remain removed from the normal workflow.
- Keep Admin/Studio out of public navigation and sitemaps; disable public analytics and the public cookie banner on the private Admin surface.

Dependency: A2 decision, approved Vercel Pro plan correction and explicit credential-write approval.

Acceptance gate: unauthorized/unknown identities fail closed, each role sees only permitted actions, and no AI/system actor can approve, apply or publish.

### A4 — Bind `admin.ccpun.com`

Outcome: the owner has one memorable Production backend address.

- Add `admin.ccpun.com` only to the private Production Admin project.
- Make `https://admin.ccpun.com/` the owner entry point and route it to `/snt-admin/`.
- Keep `/studio/` private for Draft Preview and Human Publish.
- Verify HTTPS, the exact Auth.js callback/origin, unauthenticated redirect/API denial, noindex, CSP and absence from public sitemaps before handoff.
- Do not modify `ccpun.com`, `www.ccpun.com` or their Production deployment mapping.

Dependencies: A2–A3 and explicit DNS/domain approval.

Acceptance gate: the domain resolves only to the private Admin project, unauthenticated content/API access is blocked by the application perimeter, and rollback is recorded before the DNS/domain mutation.

### A5 — Controlled Production Draft Rehearsal

Outcome: the owner proves the real workflow without publishing or altering a live article.

- Start read-only against Sanity `production` and verify dataset/project/perspective in the UI.
- Create or select one disposable Production Draft approved for rehearsal.
- Verify representative `Published-only`, `Published + Draft changes` and `Draft-only` rows open the correct base document/Draft pair without duplicates.
- Run Audit → Proposal → Human Approve → Apply to Draft → Preview.
- Verify the published document is unchanged, audit records are complete and stale/replayed actions fail safely.
- Do not Publish during the engineering rehearsal; the owner performs the first Human Publish separately after reviewing the preview.

Dependency: A4 and explicit approval for the named Production Draft mutation.

Acceptance gate: one named Draft completes the workflow, Published content remains unchanged, and Sanity history/audit evidence can reconstruct every action.

### A6 — Editorial Foundation Final Gate

Outcome: the basic CMS foundation is proven on one explicitly approved real content item before any SEO/GEO provider work begins.

- Record the selected Production article/document ID, current Published revision, public URL and rollback plan before editing.
- Create or edit its Draft through the private Production Studio; do not patch the Published document directly.
- Verify Draft status, content fields, references and Preview while the public page remains on the previous Published revision.
- Require the owner to perform the Publish action manually in private Studio. AI/system/Control Plane must not click or call Publish.
- Read back the Sanity Published revision and the public canonical page after Publish; verify content, status, canonical, robots, structured data and expected sitemap behavior.
- Confirm the Draft overlay resolves as expected, Sanity history identifies the human action, and no unrelated article changed.
- If any verification fails, stop promotion, use the pre-recorded rollback and keep Ubersuggest/GEO/Phase 4 blocked.

Dependencies: A5 and explicit owner approval for the exact article change and Human Publish.

Acceptance gate: one controlled Draft → Preview → owner Human Publish → Sanity/public read-back cycle passes with reversible evidence. A successful build or Draft-only rehearsal cannot substitute for this gate.

### A7 — Owner Handoff

Outcome: the owner can manage real content without technical help.

- Provide one entry link: `https://admin.ccpun.com/`.
- Show environment, dataset and read/write readiness in plain Thai before any action.
- Show all Production articles in one Content view with clear `Published`, `Published + Draft changes` and `Draft only` statuses.
- Provide an `แก้ไขบทความ` action that opens the exact document in the private Sanity Studio. Editing a Published article creates/updates its Draft version; the current Published page remains unchanged until Human Publish.
- Keep full article editing in Sanity Studio rather than rebuilding a second unrestricted CMS inside the Control Plane.
- Provide a five-step Start Here flow and safe explanations for blocked/stale/error states.
- Document how to Preview, Human Publish and request rollback/support.

Dependency: A6.

Acceptance gate: the owner can find and open every reconciled Production article, edit an approved article as a Draft, complete the workflow unaided and identify whether an item is Published, Published with Draft changes, Draft-only, Approved, Applied or Previewed.

**Future cloud milestone:** after A7, `admin.ccpun.com` becomes the always-on Production content backend. This migration can happen after the Local SEO/GEO loop is accepted and does not require rebuilding the provider or audit logic.

## Phase 3.5 — Ubersuggest MCP to Sanity

### U1 — Runtime Bridge and Snapshot

Outcome: the owner enters a keyword and receives a traceable research snapshot in Local UAT before the same accepted workflow is promoted to the Local Production Draft lane.

- Add one read-only server action for an owner-entered keyword.
- Verify the deployed Lab runtime can reach the approved MCP bridge.
- Validate and normalize only supported fields.
- Write `researchSnapshot` and `auditLog` atomically to `uat`.
- Show source, checked time, freshness and a plain-language error state.

Dependencies: Local UAT foundation accepted, MCP runtime path approved, and provider quota confirmed before the first real request. Vercel Pro and A2–A7 are not dependencies.

Acceptance gate: one approved keyword request creates one traceable UAT snapshot without exposing credentials or raw provider output; an equivalent retry is idempotent.

### U2 — Promote Research to Local Production Drafts

Outcome: real Production Drafts can use approved keyword evidence without turning external data into instructions.

- Promote only the U1-accepted connector and schema into the loopback-only Local Production lane.
- Store compact normalized `researchSnapshot` + atomic `auditLog` in Sanity `production` only after the Production persistence boundary is approved and verified. Do not reuse UAT credentials or add a broad fallback token.
- Preserve `trustClass = untrusted-external-data`, source, checked time, freshness and provider limitations.
- Keep provider credentials server-only and maintain the same quota, timeout, validation and idempotency controls.

Dependencies: U1 accepted, Local Production owner authentication verified, and a least-privilege Production snapshot/audit persistence path approved. Vercel Pro is not a dependency.

Acceptance gate: one owner-approved request links a traceable snapshot to a Production Draft without publishing, self-approval or avoidable duplicate quota use.

## Phase 3.6 — Deterministic GEO Intelligence

### G1 — GEO Audit and Human-Reviewed Proposals

Outcome: the owner can improve content for answer engines and AI search using explainable checks, without claims of guaranteed citation.

- Audit answer-first passages, entity clarity, author/reviewer identity, source quality, claim freshness, structured data alignment, internal links and genuine FAQ coverage.
- Check public crawler/indexing eligibility only on the public canonical page; private Admin/UAT surfaces always remain noindex.
- Map every failed check to evidence, severity and a human review step.
- Generate only Draft proposals. AI/system cannot approve, Apply to Draft, alter canonical/redirect/noindex or publish.
- Add Thai financial-content and source-quality checks; do not reward keyword stuffing or unsupported certainty.
- Record GEO snapshot freshness because crawler policies, sources and public page state can change.

Dependencies: U2 accepted. The first implementation runs locally; future cloud migration does not change the audit rules.

Acceptance gate: the owner can trace every GEO recommendation to a deterministic check and current source; no score is presented as a Google/AI ranking or citation guarantee.

## Foundation acceptance checkpoint — 22 August 2026

- สร้างบทความทดสอบใหม่เป็น Production Draft เท่านั้น โดยไม่มี Published counterpart และไม่แตะบทความเดิม
- ทดสอบครบ Control Plane: Audit → Proposal → owner-session Approve → Apply → server-only Preview
- คะแนน deterministic SEO เปลี่ยนจาก 77 เป็น 80 หลัง Apply เฉพาะ `seo.searchIntent`; คะแนนนี้เป็นเกณฑ์ภายใน ไม่ใช่คะแนน Google
- เอกสาร workflow ที่เกี่ยวข้องทั้ง 7 รายการเป็น `drafts.*`; การกด Approve/Apply ซ้ำถูกปฏิเสธด้วย `409`
- fingerprint ของ Article เดิม 44 รายการไม่เปลี่ยน, Published ยัง 5 รายการ และบทความทดสอบไม่มี stored canonical/noindex mutation
- Preview ต้องผ่าน owner authentication และ same-origin POST, ใช้ path ที่ server สร้าง, แสดง `noindex,nofollow`, ไม่มี BlogPosting schema และกลับเป็น 404 หลังปิด Preview
- ไม่ได้เพิ่ม localhost CORS ให้ Sanity; embedded Studio editing ยังเป็นการตัดสินใจภายนอกแยกจาก Control Plane Preview
- Runtime negative checks ผ่าน: unauthenticated `401`, invalid origin `403`, wrong host/public Draft `404`
- Admin/Security 54/54, TypeScript, ESLint, Vercel regression, Webpack production build และ production dependency audit ผ่าน

### Local Studio owner QA — 22 August 2026

- เพิ่ม `http://localhost:3000` เป็น Sanity CORS แบบ credentials-enabled เฉพาะช่วง QA; origin อื่นถูกปฏิเสธ `403`
- เจ้าของเข้าสู่ Studio ใน Safari และแก้เฉพาะ synthetic Production Draft: excerpt, Portable Text, Featured image จาก asset เดิม และ Alt text
- Sanity read-back ยืนยัน Autosave/revision, Featured image และ Alt text; Published counterpart ไม่มี และ fingerprint ของ Article เดิม 44 รายการตรง baseline
- Preview แสดงการแก้ไขพร้อม `noindex,nofollow`, ไม่มี BlogPosting schema และกลับเป็น `404` หลังปิด Preview
- ถอด `http://localhost:3000` CORS หลัง QA ตามขอบเขตที่อนุมัติ; read-back หลังถอดเป็น `403` และไม่มี credential headers
- ไม่ Publish, ไม่สร้าง asset ซ้ำ, ไม่แตะ canonical/noindex ที่เก็บใน Sanity, ไม่ deploy และไม่แก้ DNS

### Local Admin one-click launcher — 22 August 2026

- สร้างแอป macOS ตัวเดียว `CCPun Admin.app` สำหรับเจ้าของระบบ โดยมีสถานะและปุ่ม `เปิดระบบ`, `ปิดระบบ`, `ออกและปิดระบบ` ในหน้าควบคุมเดียว ไม่ต้องพิมพ์คำสั่งใน Terminal
- ปุ่มเปิดเพิ่มเฉพาะ `http://localhost:3000` เป็น Sanity CORS แบบ credentials-enabled, ตรวจ header จริง, เริ่ม `local:production:draft` เฉพาะ loopback และเปิด Safari
- ปุ่มปิดหยุดเฉพาะ process group ที่แอปบันทึกพร้อม start-time signature แล้วถอด CORS origin เดิม; ไม่ kill โปรแกรมอื่นที่ใช้พอร์ต `3000`
- runtime state/log อยู่ใน `.ccpun-local/` แบบ owner-only และไม่เข้า Git; ไม่มี secret อยู่ใน app, state หรือ command argument
- รอบ QA จริงผ่าน: เปิดซ้ำไม่สร้าง process/CORS ซ้ำ, listener เป็น `127.0.0.1:3000`, wrong host ได้ `404`, CORS แสดง exact origin + credentials, ปิดซ้ำได้, หลังปิดพอร์ตว่างและ Sanity ตอบ `403` โดยไม่มี allow-origin/credentials headers
- ไม่อ่านหรือแก้บทความ, ไม่ Publish, ไม่ deploy และไม่แก้ DNS ระหว่างงาน launcher

## Phase 4 — Deterministic Growth Dashboard

### D1 — GSC Read Model

- Connect the approved GSC property with read-only scope.
- Store compact query/page/date aggregates.
- Label source, date range, fetched time and partial-result state.

Acceptance gate: the dashboard explains search changes without claiming causation or ranking predictions.

### D2 — GA4 Read Model

- Connect the approved GA4 property with read-only scope.
- Store landing-page, channel and conversion-intent aggregates.
- Keep CTA clicks separate from qualified leads or sales.

Acceptance gate: traffic and conversion-intent views use consistent dates and Asia/Bangkok reporting context.

### D3 — Vercel Health

- Read only metrics available to the current Vercel plan/API.
- Show deployment state, last successful check and available health/performance signals.
- Omit unavailable metrics instead of synthesizing them.

Acceptance gate: provider or plan limits are visible and do not break other dashboard sources.

### D4 — Owner Dashboard and Opportunities

- Combine the four source summaries without merging their trust levels.
- Rank opportunities using documented deterministic rules.
- Link each signal to its source, date range and recommended human review step.

Dependencies: accepted read models from U2/G1 and the approved D1–D3 sources.

Acceptance gate: the owner can identify the next review action without reading technical logs, and every signal shows source, freshness and limitation.

## Required Controls

### Validation and provenance

- Validate every request and provider response at the server boundary.
- Keep only allowlisted fields with provider, query scope, checked time and trust class.
- Reject malformed, oversized or unexpected payloads.
- Never render provider HTML as trusted content.

### Freshness

- Every card shows source, covered date range and last successful update.
- Define a freshness threshold per source during its batch.
- Mark stale or partial data clearly; never silently present it as current.
- Keep the previous valid snapshot visible only when it is labelled stale.

### Rate limit and quota

- A human starts the first Ubersuggest fetch; no background polling in the first version.
- Enforce server-side request limits and provider timeout.
- Cache or reuse an equivalent fresh snapshot instead of consuming quota again.
- Show `quota not checked`, `quota exceeded` or `provider unavailable` as distinct states when known.

### Idempotency and audit

- Use a stable request identity for the same provider, keyword, market and freshness window.
- A retry must not create duplicate snapshots or duplicate audit events.
- Commit the normalized snapshot and its audit log in one Sanity transaction.
- If persistence fails, report `not saved`; do not show the provider response as stored data.

### Owner-friendly errors

The UI uses short Thai messages and a safe next action:

- ยังไม่ได้เชื่อมต่อ
- สิทธิ์หรือการยืนยันตัวตนไม่พร้อม
- ยังไม่ทราบโควตา
- โควตาหมด
- ผู้ให้บริการไม่ตอบสนอง
- ข้อมูลที่ได้รับไม่ผ่านการตรวจสอบ
- บันทึกไม่สำเร็จ — ไม่ได้แก้ Draft
- ข้อมูลเก่า — แสดงเพื่ออ้างอิง

Do not show credentials, raw provider errors, stack traces or provider payloads.

## Acceptance Criteria

- All routes require Auth.js identity and the matching RBAC permission.
- All writes fail closed outside an explicitly allowed lane/dataset pair: Lab/UAT may write only `uat`; Local Production may write only the separately approved Draft or normalized snapshot/audit scope in `production`; public Production remains Admin-disabled.
- Ubersuggest credentials are absent from Sanity, client bundles, responses and audit logs.
- Each stored snapshot has provenance, checked time, trust class and an atomic audit record.
- Repeating an equivalent request does not create duplicates or consume avoidable quota.
- Missing or failed sources degrade independently; one provider cannot blank the whole dashboard.
- Gap and opportunity output is deterministic and explainable from stored inputs.
- AI/system cannot self-approve, Apply to Draft, publish, delete or change canonical/redirect/noindex.
- Owner-facing screens identify the source, freshness, limitation and next human action.
- Admin tests, lint, TypeScript, Sanity schema and Vercel-native build/regression pass in Lab.
- The same accepted commit and boundary suite pass in UAT before promotion to the Local Production lane.
- If the deferred Cloud path resumes, `admin.ccpun.com` must be protected, noindex, absent from public discovery surfaces and mapped only to the dedicated private Admin project before owner handoff.
- Production content reconciliation proves every normalized Published/Draft Article identity appears exactly once; counts are not inferred from a paginated first page.
- Editing a Published article changes only its Draft overlay until the owner performs Human Publish in private Studio.
- The Editorial Foundation Final Gate includes one owner-performed Human Publish with Sanity and public-page read-back; no AI/system/Control Plane actor performs Publish.

## Explicit Boundary

This document approves the architecture and work order only. It does not itself authorize creating the Production Admin project, changing Production configuration, mutating Sanity `production`, adding `admin.ccpun.com` DNS/domain records, publishing content or performing automatic actions. Each external/Production batch requires the explicit approval named in its dependency.

Active Local order: completed foundation F1–F6 → UAT release candidate R1 → Production content inventory A0 → Local Production Draft lane → Ubersuggest U1 in UAT → Ubersuggest U2 in Local Production → GEO G1 → Growth Dashboard D1–D4 → final adversarial security review → owner-controlled real Publish gate. Each external connector batch still requires its own credentials, quota and scope approval.

Deferred Cloud order: A2–A7 → `admin.ccpun.com` only when always-on or multi-device access justifies the commercial hosting and DNS work. This is a migration of the accepted Local system, not a prerequisite for or a rewrite of Ubersuggest, SEO, GEO or the Growth Dashboard.

## 2026-08-22 — SOL/XHIGH security gate

The final source review for SOL-H1–H3 found no residual P0/P1 after origin-pinned OAuth discovery, private-network/redirect rejection, owner-only provider quota permission, server-side concurrency/rate limits and future-date GEO validation were added. Admin `99/99`, lint, TypeScript, schema `0/0`, Vercel regression, Webpack build and production dependency audit passed.

This verdict permits only owner-controlled Local UAT runtime acceptance. Ubersuggest OAuth/first keyword, least-privilege Production research persistence and GSC/GA4/Vercel credentials remain separate approval and runtime gates. Multi-user token lifecycle, broader provider payload streaming limits and dashboard refresh caching remain P2 hardening before a future always-on Cloud Admin, not blockers for the current single-owner Local UAT acceptance.
