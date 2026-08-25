# CCPun Admin Production release marker — 2026-08-25

This marker triggers the first Git-traceable `ccpun-admin-prod` deployment after the project was connected to `punniix/CCPun-Update-4.0`.

Release source:
- Base branch: `v4-production`
- Merged feature PR: #21
- Verified feature head: `de270cd282136c730b1174ee4a93a249b6a05c27`
- Merge commit: `f21ff477665c1ad407c921015f7866c7897b07da`
- Foundation CI: #103 SUCCESS
- Public Vercel production after merge: READY

Production Admin scope:
- Safe Article Draft delete / guarded unpublish lifecycle
- Ubersuggest account quota snapshots
- Ubersuggest Research History
- Ubersuggest GEO/AEO visibility and AI Prompt Gaps

Explicitly not enabled in this release:
- Generative SEO metadata AI
- Cloud-hosted Ubersuggest OAuth credentials
- Permanent deletion of previously published URLs

Provider OAuth secrets remain local-only. Production Admin reads non-secret Ubersuggest snapshots from Sanity Production.
