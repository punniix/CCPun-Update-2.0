# Website 4.2 Phase 1 — Social Foundation

Status: UAT-only foundation. No real platform connection or publishing.

## Ownership

- Sanity owns `masterContent`, editorial channel variants, copy, scripts, media references, and the existing review metadata.
- Neon Postgres will own operational accounts, encrypted credential envelopes, publication state, durable jobs, idempotency, comment execution state, media metadata, and execution audit events.
- Media bytes are not stored in Postgres. A storage provider is intentionally deferred to Phase 2.

## UAT boundary

The feature is available only when all conditions match:

- `CCPUN_SOCIAL_ENABLED=1`
- `CCPUN_SOCIAL_DATA_MODE=synthetic`
- Admin environment is `admin-uat`
- Vercel project is the `ccpun-admin` survivor
- Git branch is `codex/website-42-social-foundation`

Any missing or mismatched value fails closed. Production defaults to disabled.

The optional `CCPUN_SOCIAL_DATABASE_URL` is server-only and is exposed to application code only as a boolean readiness state. Its value must never be returned, logged, committed, or stored in Sanity.

## Implemented contracts

- Master Content to channel variant relationship
- Channel and format allowlists
- Direct, native-scheduled, native-finish, TikTok Draft, and assisted distribution modes
- Publication state machine
- Ordered Facebook Comment Series model
- Media metadata abstraction without storage purchase
- Durable job and idempotency schema
- Encrypted credential-envelope column with key versioning
- Execution audit schema
- Authenticated read-only synthetic UAT endpoint and Admin page

## Deferred by design

- Applying the SQL migration to Neon
- OAuth and real social accounts
- Platform publishing, scheduling, webhooks, and analytics
- Media upload/storage
- Navigation exposure
- Production flags and Production database configuration

## Rollback

Close the Draft PR or revert its commit. No Production database, Sanity document, provider account, social post, URL, analytics event, or consent setting is changed by this phase.
