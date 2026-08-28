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
- Git branch is exactly `codex/website-42-media-library-foundation-20260828`
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

The migration contains no token, credential, signed URL, or provider-specific secret. It is code-only in this phase and must not be applied without a separate approval and least-privilege role review.

## Rollback

Disable `CCPUN_MEDIA_LIBRARY_ENABLED` and redeploy the UAT Preview. Revert the Phase 2 commit to remove code. Do not drop database tables automatically; schema removal requires separate destructive approval and a data/export review.
