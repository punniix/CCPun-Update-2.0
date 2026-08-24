# CCPun Platform Architecture v1

Date: 2026-08-24
Status: Architecture freeze / migration target

## Goal

Keep CCPun safe, simple to operate, easy to track, and recoverable even when the primary notebook is unavailable.

The architecture separates five concerns that must not be mixed together:

1. **Application** — Web vs Admin.
2. **Environment** — Production, UAT, Preview/Lab.
3. **Data trust domain** — Sanity Production vs Sanity Non-Production.
4. **Release version** — Git tag / GitHub Release, not Vercel project name.
5. **Operator** — Human, Codex Local, or Codex Cloud.

## Source of truth

| Concern | Source of truth |
|---|---|
| Code | GitHub |
| Production runtime | Vercel |
| Published content | Sanity Production |
| Test content | Sanity Non-Production |
| Release identity | Git tag / GitHub Release |
| Runtime logs | Vercel |
| Content history | Sanity History |
| Architecture | Repository docs |
| AI workers | Not a source of truth; all durable work must land in GitHub |

## Target Vercel model

The steady-state target is **three active Vercel projects**.

### 1. `ccpun-web`

Current project during migration: `ccpun-web-v4-prod` (`prj_dxwjITkd0av5QiJQv2snUlIASUWu`).

Purpose: public CCPun website only.

Environments:

- **Production** — `ccpun.com`, `www.ccpun.com`, Production Published content only.
- **UAT** — branch `uat`, Sanity Non-Production, noindex, test-safe analytics.
- **Preview** — feature/fix/SEO/performance/UX branches.

The project name may be renamed only after environment and guard migration is proven. A version number must not be added to the final project name.

### 2. `ccpun-admin-prod`

Current project: `ccpun-admin-prod` (`prj_6tuUxJxYbQ4mpF7sMgNWx2p2jowN`).

Purpose: private owner-facing Production editorial/control surface at `admin.ccpun.com`.

Rules:

- Production only.
- Authenticated and noindex.
- May connect to Sanity Production only when the `production-admin` lane and exact Vercel Project ID are both verified.
- Human publish remains a separate approval action.

### 3. `ccpun-admin-nonprod`

Target project to replace the active roles currently split between:

- `ccpun-web-lab` (`prj_438M14AAob2nbf20q7Xa5L7A7aMo`)
- `ccpun-web-v4-1-uat` (`prj_OR7AlGsE8spGahQegDvd0JudaiEg`)

Purpose: Admin / Intelligence / SEO / AI development without Production credentials.

Environments:

- **Lab** — architecture and major feature development.
- **UAT** — integrated release-candidate validation.
- **Preview** — branch-level validation.

This project must use only Sanity Non-Production and must fail closed on any Production project/dataset mismatch.

## Legacy Vercel projects

The following projects are not deleted during migration:

- `ccpun-web-v4-uat` (`prj_E3Z5RDozUgrbW625d6pE8aQdfQuK`)
- `ccpun-web-lab`
- `ccpun-web-v4-1-uat`

They become **legacy/read-only** only after their replacement paths pass verification. No new normal workflow should depend on a legacy project after cutover.

## Sanity trust domains

### Production

- Project: `kyfxgjnq`
- Dataset: `production`

Allowed consumers:

- Public Web Production — Published perspective only.
- `ccpun-admin-prod` — authenticated Production Draft workflow under policy.
- Explicitly approved local Production workflow.

### Non-Production

- Project: `ccb9lnw5`
- Dataset: `uat`

Allowed consumers:

- Web UAT / Preview when content testing is required.
- Admin Non-Production Lab / UAT / Preview.
- Local UAT.

**Code promotion never implies content promotion.** UAT test content is never automatically copied into Production.

## Environment identity and fail-closed rule

Application capability must be derived from a verified tuple, not a project name alone:

```text
CCPUN_APP_ENV
+ VERCEL_PROJECT_ID
+ Sanity project ID
+ Sanity dataset
= allowed lane
```

A missing or mismatched value must disable privileged clients, Draft mutation, Studio, or Admin capability rather than falling back to another environment.

Target examples:

```text
public-production
+ exact web project ID
+ kyfxgjnq
+ production
= Published public reads only
```

```text
production-admin
+ exact admin-prod project ID
+ kyfxgjnq
+ production
= authenticated Production Draft lane
```

```text
lab / uat
+ exact admin-nonprod project ID
+ ccb9lnw5
+ uat
= non-production Admin operations only
```

## Engineering plane

### Human owner

Owns product decisions, Production approval, control-plane recovery, DNS/domain changes, Production credentials, and emergency actions.

### Codex Local

Primary heavy engineering path when the notebook is available. May use approved local-only workflows. Production content remains protected by the repository policy.

### Codex Cloud

Remote/fallback engineering worker when the notebook is unavailable.

Allowed by default:

- Read source.
- Create working branches.
- Implement code.
- Run available tests/builds.
- Create commits/PRs.
- Use Preview/UAT and Non-Production data when scoped.

Not allowed by default:

- DNS/domain mutation.
- Production secret administration.
- Production Sanity write/publish.
- Direct Production deployment outside the normal Git/approval path.
- Self-approval of a release.

Codex Local and Codex Cloud use the same GitHub -> CI -> Preview/UAT -> human approval -> Production flow.

## Git and branch model

Keep the current Production branch `v4-production` during migration. Do not rename it while Vercel/CI dependencies still use it.

Normal branch families:

```text
feature/*
fix/*
hotfix/*
seo/*
analytics/*
perf/*
admin/*
experiment/*
```

Branch names describe the work, not the agent that performs it.

## Version model

Version belongs to the release, not the Vercel project.

### Web

Examples:

```text
web-v4.2.0
web-v4.2.1
web-v4.3.0
web-v5.0.0
```

### Admin

Examples:

```text
admin-v1.0.0
admin-v1.1.0
```

Web and Admin versions move independently.

Use Semantic Versioning:

- **Major** — generation/architecture change.
- **Minor** — meaningful backward-compatible feature release.
- **Patch** — bug/performance/SEO implementation fix without a new product generation.

UAT release candidates may use:

```text
web-v4.2.0-rc.1
web-v4.2.0-rc.2
```

Production receives the final tag only after acceptance.

## Normal delivery path

```text
Human decision
    -> feature/fix branch
    -> Codex Local / Codex Cloud / Human implementation
    -> tests
    -> Pull Request
    -> CI
    -> Vercel Preview
    -> UAT when integration validation is required
    -> Human approval
    -> v4-production
    -> Vercel Production
    -> Git tag / GitHub Release
```

No agent gets a bypass around GitHub, CI, Preview/UAT, or the human Production gate.

## Emergency / break-glass plane

The notebook must never be the only recovery path.

Human break-glass access must be possible from a phone, spare computer, or trusted temporary browser session for:

- Domain registrar / DNS provider.
- Vercel.
- GitHub.
- Sanity.
- Primary identity / Google OAuth administration.
- Password manager / recovery material.

Requirements:

- At least two independent recovery factors for critical identities.
- Recovery codes stored outside the primary notebook.
- Prefer two hardware security keys stored separately.
- A short emergency runbook available outside GitHub.
- A known-good inventory of critical domains, project IDs, datasets, and recovery locations without storing plaintext secrets in Git.

Codex Cloud may diagnose a control-plane incident and propose exact recovery steps, but high-impact DNS/domain/account changes remain human break-glass actions.

## Migration sequence

### Phase 0 — Architecture freeze

- Record this architecture.
- Reconcile documentation against live Vercel/Sanity/GitHub state.
- Make no Production routing, DNS, content, analytics, or environment changes.

### Phase 1 — Guard refactor

- Replace project-name-only assumptions with lane + exact Project ID + Sanity project/dataset checks.
- Preserve transitional support for existing Lab/UAT projects until cutover.
- Add regression tests that prove mismatches fail closed.

### Phase 2 — Web UAT consolidation

- Add a UAT environment to the main Web project.
- Bind it to branch `uat`.
- Use only Sanity Non-Production.
- Keep it noindex and analytics-safe.
- Verify before freezing `ccpun-web-v4-uat`.

### Phase 3 — Admin Non-Production consolidation

- Create `ccpun-admin-nonprod`.
- Move Lab and UAT roles into its separate environments.
- Give it no Production credentials.
- Verify all privileged cross-lane attempts fail closed.
- Freeze old Lab/UAT projects after parity is proven.

### Phase 4 — Release tracking

- Introduce Web/Admin release tags and GitHub Releases.
- Record Git SHA, Vercel deployment, environment, release version, and rollback reference.
- Keep version numbers out of Vercel project names.

### Phase 5 — Production protection

- Add required status checks to the Production branch without creating a solo-maintainer reviewer deadlock.
- Keep direct/force Production mutation blocked where supported.

### Phase 6 — Break-glass readiness

- Verify recovery access from a non-notebook device.
- Record known-good DNS/runtime configuration.
- Verify account recovery factors.
- Prepare an emergency static contact surface on independent hosting if desired.

## Migration safety rule

Do not delete or rename an existing Vercel project, move a domain, change DNS, copy Production secrets, or mutate Sanity Production merely to make the architecture look cleaner.

Every migration step must first establish a replacement path, verify it, record rollback, and only then freeze the old path.
