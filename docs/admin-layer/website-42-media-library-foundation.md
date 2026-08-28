# Website 4.2 Phase 2 — Media Library Foundation

Status: synthetic Admin UAT foundation only. No storage provider, media bytes, real account, platform request, Sanity write, or Production mutation.

## Ownership

- `lib/admin/media/` owns reusable media metadata, upload-intent validation, fail-closed runtime state, and server-only orchestration.
- `app/api/snt-admin/media/` owns authenticated Admin route handlers.
- `features/admin/media/` owns the Media Library UAT presentation inside the existing Distribution surface.
- `db/migrations/20260828_website_42_media_library_foundation.sql` owns additive operational metadata for storage objects, direct-upload sessions, and variant usage.
- Sanity continues to own editorial content. Media bytes, provider sessions, storage object keys, and execution state do not belong in Sanity.

## Feature gate

The only Phase 2 flag is `CCPUN_MEDIA_LIBRARY_ENABLED`.

The runtime enables only when every condition matches:

- flag is exactly `1`
- `CCPUN_APP_ENV=admin-uat`
- Vercel project is the Admin survivor
- Git branch is exactly `codex/website-42-social-media-integration-20260829`
- Sanity is exactly `ccb9lnw5/uat`

The default is disabled. Unknown environment, branch, project, or dataset values fail closed.

## Direct-upload boundary

The application accepts strict JSON metadata up to 4 KiB only. It rejects unknown fields, multipart data, file bytes, buffers, missing/invalid length, and larger request bodies.

Target flow after a provider is approved:

```text
Browser
  -> authenticated metadata-only upload intent
  -> short-lived provider upload session
  -> direct upload from Browser to object storage
  -> server-side verification
  -> reusable media asset becomes ready
```

The current provider state is `not-connected`. The upload-intent endpoint returns a deterministic blocked session and `503 storage-not-configured`; it never returns a signed URL or credential. A real provider adapter must be a separate reviewed task after cost and security approval.

## Cost-minimized Drive-first boundary

The approved target design uses Google Drive as the long-lived source archive and object storage only as temporary publishing staging when a platform requires a retrievable URL.

```text
Google Drive / CCPun folder
  -> select approved source file
  -> stage only when a provider needs it
  -> native platform handoff
  -> delete staging after confirmed handoff and retry window
```

- Google Drive access is restricted to the one owner-selected folder whose exact immutable folder ID is recorded as the CCPUN root. Folder name matching is never an authorization control.
- Request only `https://www.googleapis.com/auth/drive.file`. Do not request broad `drive` or `drive.readonly` scopes.
- Every file operation must verify that the file is the configured root or descends from that root. Unknown, moved, shortcut-escaped, trashed, or unverifiable items fail closed.
- Use a short-lived owner access token only during an interactive import/preparation session. Do not persist a Google Drive refresh token in Sanity, Neon, logs, or client storage.
- Keep Drive bytes out of Next.js request bodies. The browser performs approved resumable/direct transfers; Vercel remains the metadata and orchestration plane.
- Neon stores only metadata, immutable Drive file ID, provider handoff state, platform object IDs, and audit references.
- No CCPUN CDN is required for social distribution. Facebook, Instagram, YouTube, and TikTok deliver accepted media through their own networks.
- Temporary object storage is created only when a provider needs a pullable URL or durable retry source. Reuse one staging object across eligible platform handoffs, then delete it seven days after all handoffs succeed, with a 30-day lifecycle fallback.
- YouTube should use its native resumable upload and scheduler where practical. Do not stage a duplicate merely for architectural uniformity.
- Do not add Google service accounts for a personal My Drive folder, a second database, Vercel Blob, a dedicated CDN, or multiple storage adapters without a demonstrated need and separate approval.

The runnable foundation is intentionally a pure server-only contract in `lib/admin/media/google-drive-foundation.ts`, with a fail-closed browser runtime guard. It accepts only normalized synthetic metadata and verifies the current parent chain against one exact immutable root folder ID. It denies shortcuts rather than resolving them, and denies moved/outside-root, trashed, cyclic, duplicate, missing, multi-parent, or otherwise unverifiable ancestry. Folder names never grant access.

The server-only adapter now fetches current file metadata and parent ancestry directly from the Drive API, validates every response with Zod, and then invokes this boundary. It never downloads media bytes. The access token remains an in-memory request value and is not returned, logged, written to disk, or stored in Sanity/Neon. Provider errors are reduced to the sanitized `provider-unavailable` state. Client-asserted file IDs, parents, trashed state, MIME types, shortcut targets, or ancestry snapshots are never treated as authorization evidence.

The authorization contract accepts only `drive.file`, an owner-interactive session, a maximum one-hour lifetime, memory-only access-token handling, and explicitly forbidden refresh-token persistence. It does not implement OAuth, persist a provider connection, or authorize uploads.

No route, UI, dependency, table, or migration change is added for Drive in this synthetic phase. The existing operational schema does not yet persist Drive source provenance. Adding immutable Drive file/root IDs and durable audit evidence is a blocked write-lane design/migration gate before any real import can be enabled; provenance is returned only by the in-memory boundary evaluation for now.

Provider connection state is represented separately as metadata-only states (`disconnected`, `authorization-pending`, `connected`, `refresh-required`, `revoked`, `error`). This state machine contains no token fields and cannot perform OAuth or provider calls.

This design keeps the expected early incremental cost at zero while usage remains inside the owner's existing Drive allowance, Neon Free allowance, Google API quota, and any future object-storage free tier. It does not authorize a Google connection, bucket, billing account, or provider secret.

## API and authorization

- `GET /api/snt-admin/media/` requires Auth.js, `social:read`, the configured Admin origin, and the exact UAT feature gate.
- `POST /api/snt-admin/media/upload-intents/` additionally requires owner-only `media:upload`, an exact same-origin `Origin` header, and JSON content type.
- Both routes return `Cache-Control: no-store` and sanitized categories only.
- The upload-intent response explicitly states that application bytes were not accepted.
- Upload-intent requests use a process-local, per-actor rate limit. Only a SHA-256 actor key is retained in memory; throttled responses expose only `429`, a sanitized category, request ID, and `Retry-After`.
- The current endpoint is a no-op `503 storage-not-configured` lane and does not create an audit event. Durable audit insertion is a blocked security gate that must be implemented and reviewed before any real provider or write lane can be enabled.

## Operational schema

The additive migration requires the reviewed Social Foundation v2 ledger first and refuses unknown pre-existing Media tables.

- `media_storage_object` stores provider-neutral object metadata: provider, bucket/store, object key, MIME type, byte size, checksum, optional ETag, visibility, and lifecycle status.
- `media_upload_session` stores direct-upload state, idempotency, actor/request references, expected file metadata, expiry, and sanitized failure category.
- `social_variant_media` connects one reusable media asset to channel variants without duplicating the file.

The migration contains no token, credential, signed URL, or provider-specific secret. Under a separate owner-approved UAT batch, it was applied to the existing `neon-canary-candle` resource only after an empty-schema and Social-ledger preflight. Postflight confirmed the frozen checksum, all three tables, the required index, and zero rows. This UAT schema readiness does not authorize runtime writes, provider access, Production binding, or Production migration; each remains a separate reviewed gate.

## Rollback

Disable `CCPUN_MEDIA_LIBRARY_ENABLED` and redeploy the UAT Preview. Revert the Phase 2 commit to remove code. Do not drop database tables automatically; schema removal requires separate destructive approval and a data/export review.
