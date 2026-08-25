# CCPun Admin — Research Intelligence Figma Sync Contract

Status: IMPLEMENTATION READY FOR QA / FIGMA MCP SYNC PENDING
Date: 2026-08-25

## Target Figma audit file

- File: `CCPun UX/UI — Production Baseline & Design System Pilot`
- File key: `2qes5uqbxyJjxwHiqs3sZM`
- Existing responsive audit page: `03 — Responsive UX Spec`
- Existing canonical QA viewport family: 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×800, 1440×900

Figma MCP sync is pending because the connected Figma Starter plan hit its MCP tool-call limit during this implementation turn. Do not create a replacement design file. Resume against the same file when the tool is available.

## Product decision

Research and Ubersuggest are no longer separate Admin destinations. `/snt-admin/research/` is the canonical Research Intelligence workspace. `/snt-admin/ubersuggest/` remains only as a compatibility redirect to `#ubersuggest-intelligence`.

## Canonical workflow

1. **เก็บข้อมูล** — manual research on Production; live Ubersuggest provider query remains local-only until secure Cloud OAuth exists.
2. **Match บทความ** — compare normalized research keywords with current Primary/Secondary keyword coverage before creating new content.
3. **Ubersuggest** — account snapshot, freshness, provider quota/usage/remaining, local-only sync control.
4. **GEO / AEO** — AI answers, tracked prompts, competitor count, average AI rank, provider breakdown, intents and prompt gaps.
5. **History** — one combined Manual + Ubersuggest research table with decision status, internal opportunity score, provider and evidence metadata.

## UX/UI acceptance criteria

- One left-nav item only: `Research Intelligence`; no second `Ubersuggest` navigation item.
- A five-step anchor navigator appears near the page heading and keeps the workflow understandable without duplicating screens.
- Production Admin must visibly communicate snapshot mode instead of presenting local OAuth controls.
- Quota cards must distinguish `available`, `near-limit`, and `full` states and display `used / limit` plus `remaining`.
- GEO/AEO and Prompt Gap sections must sit inside the same workflow, not behind a separate dashboard.
- Manual and Ubersuggest history must be presented as one decision table.
- Tables stay inside horizontal scroll regions; the page itself must not widen the mobile viewport.
- Mobile/tablet layouts stack cards and provider breakdown rows; desktop can use multi-column grids.
- Buttons/anchor targets keep the existing Admin minimum touch-target pattern (44px / `min-h-11`).
- Keep existing dark Admin surface, gold primary action treatment, emerald success, amber gap/warning, sky provider, violet GEO/AEO semantics.
- No public-site redesign, content rewrite, SEO URL/canonical/redirect change, analytics change, or Sanity content-model change is part of this sync.

## States to represent in Figma audit

### Production snapshot state
- Ubersuggest snapshot ready.
- No `Connect Ubersuggest` OAuth button.
- Provider quota and GEO/AEO data visible from Sanity snapshots.

### Local provider state
- Ubersuggest connected locally.
- Live keyword query and provider sync controls available.

### Empty/error state
- No fabricated zero values when provider/snapshot reads fail.
- Empty Research History is explicit.
- GEO/AEO empty state does not imply 0% unless a valid snapshot exists.

## Design-sync delta to add to Figma

Add/update an Admin Research Intelligence audit frame covering:
- navigation consolidation,
- 5-step workflow,
- Production snapshot state,
- quota cards,
- GEO/AEO provider breakdown,
- AI Prompt Gaps,
- unified decision/history table,
- responsive acceptance at the existing 7 canonical viewport sizes.

Do not create a new Figma file. Sync this delta into the existing CCPun UX/UI audit file when Figma MCP calls are available again.
