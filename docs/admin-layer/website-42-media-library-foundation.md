# Website 4.2 Phase 2 — Media Library Foundation

Status: synthetic Admin UAT foundation only. No storage provider, media bytes, real account, platform request, Sanity write, or Production mutation.

## Ownership

- `lib/admin/media/` owns reusable media metadata, upload-intent validation, fail-closed runtime state, and server-only orchestration.
- `app/api/snt-admin/media/` owns authenticated Admin route handlers.
- `features/admin/media/` owns the Media Library UAT presentation inside the existing Distribution surface.
- `db/migrations/20260828_website_42_media_library_foundation.sql` owns additive operational metadata for storage objects, direct-upload sessions, and variant usage.
- The owner-selected Google Drive folder `CCPun-Financial Advisor Project` is the source of truth for private strategy/research documents and long-lived media.
- Sanity continues to own Article Draft and Published content. Private document bodies, media bytes, provider sessions, storage object keys, and execution state do not belong in Sanity.
- Neon owns operational state only. It must not receive Drive document bodies or media bytes.

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

The approved zero-cost target design uses Google Drive as the source of truth for private strategy/research documents and long-lived media. Object storage is temporary publishing staging only when a platform requires a retrievable URL.

```text
Google Drive / CCPun folder
  -> select approved source file
  -> stage only when a provider needs it
  -> native platform handoff
  -> delete staging after confirmed handoff and retry window
```

- Google Drive access is restricted to the two owner-selected folders `Website 4.2 — Admin Control Plane` and `Website 4.2 — Media Library`. Their exact immutable folder IDs are configured server-side; folder name matching is never an authorization control.
- Request only `https://www.googleapis.com/auth/drive.file`. Do not request broad `drive` or `drive.readonly` scopes.
- Every file operation must verify that the file is the configured root or descends from that root. Unknown, moved, shortcut-escaped, trashed, or unverifiable items fail closed.
- Use a short-lived owner access token only during an interactive import/preparation session. Do not persist a Google Drive refresh token in Sanity, Neon, logs, or client storage.
- Keep Drive bytes out of Next.js request bodies. The browser performs approved resumable/direct transfers; Vercel remains the metadata and orchestration plane.
- Do not copy a selected document body into Sanity or Neon. Drive remains authoritative; any later approved Neon record may contain only an immutable file reference and operational handoff/audit state.
- No CCPUN CDN is required for social distribution. Facebook, Instagram, YouTube, and TikTok deliver accepted media through their own networks.
- Temporary object storage is created only when a provider needs a pullable URL or durable retry source. Reuse one staging object across eligible platform handoffs, then delete it seven days after all handoffs succeed, with a 30-day lifecycle fallback.
- YouTube should use its native resumable upload and scheduler where practical. Do not stage a duplicate merely for architectural uniformity.
- Do not add Google service accounts for a personal My Drive folder, a second database, Vercel Blob, a dedicated CDN, or multiple storage adapters without a demonstrated need and separate approval.

The runnable foundation is intentionally a pure server-only contract in `lib/admin/media/google-drive-foundation.ts`, with a fail-closed browser runtime guard. It verifies the current parent chain against either of the two exact configured immutable root folder IDs. It denies shortcuts rather than resolving them, and denies folders selected as files, moved/outside-root, trashed, cyclic, duplicate, missing, multi-parent, or otherwise unverifiable ancestry. Missing, duplicate or malformed root configuration fails closed. Folder names never grant access.

The server-only adapter now fetches current file metadata and parent ancestry directly from the Drive API, validates every response with Zod, and then invokes this boundary. It never downloads media bytes. The access token remains an in-memory request value and is not returned, logged, written to disk, or stored in Sanity/Neon. Provider errors are reduced to the sanitized `provider-unavailable` state. Client-asserted file IDs, parents, trashed state, MIME types, shortcut targets, or ancestry snapshots are never treated as authorization evidence.

The authorization contract accepts only `drive.file`, an owner-interactive session, a maximum one-hour lifetime, memory-only access-token handling, and explicitly forbidden refresh-token persistence. It does not implement OAuth, persist a provider connection, or authorize uploads.

## Bounded Admin projection

The Admin UAT API now supports a manual selected-file refresh. It accepts strict JSON containing one selected file ID, one ephemeral access token and the bounded authorization metadata. The authorization must be owner-interactive, use exactly `drive.file`, last no more than one hour, keep the access token in memory only and forbid refresh-token persistence. The API re-fetches current Drive metadata and ancestry on every manual refresh.

Successful responses project only `id`, `name`, `mimeType`, `modifiedTime`, `webViewLink`, `thumbnailLink` and `iconLink`. Drive response fields such as body/content, bytes, permissions, owners and email addresses are discarded by the server schema. The token, configured root IDs, ancestry evidence and raw provider response never appear in the response.

The UI preserves the synthetic Media Library and shows the selected-file/Refresh surface in a disabled `Manual OAuth / Picker` state until the required Picker configuration and owner authorization are completed. It does not accept pasted tokens or invent client values. The projection remains a view of Drive, not another document store, and does not crawl folders, search unselected files, request `drive` or `drive.readonly`, proxy private bytes through Vercel, or create a provider connection.

No dependency, table or migration is added for this projection. Nothing is written to Sanity, Neon, disk, browser storage or logs. Adding immutable Drive file/root IDs and durable audit evidence remains a blocked write-lane design/migration gate before any real import can be enabled.

### Required manual Picker/OAuth configuration

The code does not create an OAuth client or provider credential. Before enabling the UI, the owner must authorize or select an already approved Google provider client and configure these exact names only in `ccpun-admin` Preview for branch `codex/website-42-social-media-integration-20260829`:

- `CCPUN_GOOGLE_DRIVE_ADMIN_ROOT_FOLDER_ID` — server-only immutable ID for `Website 4.2 — Admin Control Plane`; nonsecret identifier, never returned to the browser.
- `CCPUN_GOOGLE_DRIVE_MEDIA_ROOT_FOLDER_ID` — server-only immutable ID for `Website 4.2 — Media Library`; nonsecret identifier, never returned to the browser.
- `NEXT_PUBLIC_CCPUN_GOOGLE_DRIVE_PICKER_API_KEY` — browser-visible Google Picker developer key restricted to the approved Admin Preview origin and Picker API.
- `NEXT_PUBLIC_CCPUN_GOOGLE_DRIVE_OAUTH_CLIENT_ID` — browser-visible ID of the approved Google provider OAuth client; do not substitute the Admin-login client by implication.

The owner must complete Google sign-in/consent manually with only `https://www.googleapis.com/auth/drive.file`. The returned access token and its issue/expiry metadata stay in the active browser memory and POST body only; they are not Vercel environment variables. No client secret or refresh token belongs in this flow. If either Picker public variable, either root ID, or manual authorization is absent, the UI/route remains disabled or fails closed.

Provider connection state is represented separately as metadata-only states (`disconnected`, `authorization-pending`, `connected`, `refresh-required`, `revoked`, `error`). This state machine contains no token fields and cannot perform OAuth or provider calls.

This design keeps the expected steady-state incremental cost at zero while usage remains inside the owner's existing Drive allowance, Neon Free allowance and Google API quota. It does not authorize a Google provider connection, bucket, billing account, object-storage dependency or provider secret.

## API and authorization

- `GET /api/snt-admin/media/` requires Auth.js, `social:read`, the configured Admin origin, and the exact UAT feature gate.
- `POST /api/snt-admin/media/` is the human-only manual Drive refresh. It additionally requires an exact same-origin `Origin`, strict bounded JSON, both configured root IDs and valid `drive.file` authorization no older than one hour.
- `POST /api/snt-admin/media/upload-intents/` additionally requires owner-only `media:upload`, an exact same-origin `Origin` header, and JSON content type.
- All routes return `Cache-Control: no-store` and sanitized categories only. The Drive projection performs read-only metadata requests and has no upload/provider-write method.
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
