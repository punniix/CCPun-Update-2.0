# Repository architecture review summary

The repository is organized around four source ownership boundaries:

- `app/`: Next.js routes, metadata and route composition.
- `features/`: product and domain features.
- `core/`: protected application infrastructure, including content, Sanity, auth, environment, SEO, analytics and consent.
- `shared/`: reusable UI, layouts, hooks, types and utilities.

Agents must read `AGENTS.md` and `docs/architecture/repository-architecture.md` before repository-wide work. The permanent architecture guard rejects the legacy root source buckets `components/`, `lib` and `hooks` and checks approved dependency directions.

This refactor intentionally changes source organization only. Public URL ownership, canonical URLs, redirects, sitemaps, Sanity Production content, analytics event names and consent behavior remain protected contracts.
