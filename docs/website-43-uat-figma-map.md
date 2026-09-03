# Website 4.3 UAT — Figma → Code Map

Status: UAT / Preview only

Source of truth: Figma file `2qes5uqbxyJjxwHiqs3sZM`, page `14 — Website 4.3 · Source of Truth`, root node `495:23`.

Production safety:
- `v4-production` is read-only for this task.
- Production routes and `app/page.tsx` are not modified.
- Existing SEO, metadata, schema, sitemap, redirects, consent, analytics, Sanity, calculators, and backend contracts remain the production reference.
- Website 4.3 is implemented only under `/preview/website-4-3/**` until explicit production approval.

## Route mapping

| Figma route | Figma frames (D / T / M) | UAT route | React mapping | Responsive contract |
|---|---|---|---|---|
| 01 Home | `846:737` / `884:843` / `884:999` | `/preview/website-4-3` | `Website43Home` + shared `Website43Navbar` / `Website43Footer` | Match 1440 / 820 / 390 compositions. Mobile hero is a distinct composition; About portrait stage is square 400 / 260 / 318 with the subject shifted down inside the crop. No removed Trust Strip. |
| 02 Blog | `665:72` / `665:171` / `665:254` | `/preview/website-4-3/blog` | `Website43Blog` + `Website43ArticleCard` + shared shell | 3-col / 2-col / 1-col article layout, Figma carousel proportions, balanced final row, responsive search/filter controls. |
| 03 Article | `666:108` / `666:201` / `666:277` | `/preview/website-4-3/blog/[category]/[slug]` | `Website43Article` + shared shell | Desktop TOC beside 720px reading column; tablet/mobile reading composition follows Figma; mobile TOC becomes compact/collapsible presentation. |
| 04 Financial Health Check | `667:144` / `667:272` / `667:383` | `/preview/website-4-3/tools/financial-health-check` | `Website43FinancialHealthCheck` + existing `LifeCoverageWizard` | Figma 4.3 hero/story/FAQ/CTA presentation; calculator logic remains the existing production engine. 1440 / 820 / 390 layout follows Figma. |
| 05 CI Planning | `668:180` / `668:302` / `668:407` | `/preview/website-4-3/ci-planning` | `Website43CIPlanning` + existing `CIWizard` | Figma 4.3 hero/story/cards/FAQ presentation; existing calculator engine reused. 1440 / 820 / 390 layout follows Figma. |
| 06 Privacy | `669:216` / `669:276` / `669:318` | `/preview/website-4-3/privacy` | `Website43Privacy` using shared legal primitives | Desktop side index + 720px body; tablet/mobile in-page compact index and Figma reading rhythm. Figma copy is authoritative for preview. |
| 07 Cookie | `670:252` / `670:344` / `670:419` | `/preview/website-4-3/cookie-policy` | `Website43CookiePolicy` + existing cookie settings event | Public policy follows Figma; Figma state-spec examples are documentation only, not duplicated as public content. “ตั้งค่าคุกกี้” reuses `ccpun:openCookieSettings` so consent/GA/GTM/Meta contracts remain unchanged. |
| 08 404 | `672:288` / `672:326` / `672:347` | `/preview/website-4-3/404` | `Website43NotFound` + shared shell | Preview-only visual route so production `app/not-found.tsx` remains untouched; compact tablet/mobile heights follow Figma. |

## Shared Figma primitives

- Typography: Kanit only.
- Deep background `#251818`; main background `#352727`; surface `#4A3A3A`; subtle border `#5B4848`; accent `#E0C985`; default ink `#FAF9F9`; muted ink `#BAABAB`.
- Desktop content gutter: 80px / max visual width 1280px.
- Shared desktop navbar: 1280 × 72 at x=80, y=32, restrained translucent blur.
- Shared footer: Figma 4.3 footer hierarchy and copy; route wrappers preserve the breakpoint-specific outer spacing.
- No generic SaaS styling, no light-theme reinterpretation, no typography shrinking solely to force fit.

## Implementation rule

For every section: **Figma says X → preview code does X**. Existing production components may be reused only for behavior/data contracts or when their visual output already matches Figma; `features/website-43-preview/Website43FigmaAudit.tsx` is not a design source.
