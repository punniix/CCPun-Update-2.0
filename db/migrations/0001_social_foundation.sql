BEGIN;

CREATE SCHEMA IF NOT EXISTS ccpun_social;

CREATE TABLE IF NOT EXISTS ccpun_social.social_account (
  id text PRIMARY KEY,
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'youtube', 'tiktok')),
  provider_account_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('disconnected', 'connected', 'expired', 'revoked')),
  encrypted_credentials bytea,
  credential_key_version integer,
  token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'connected' OR (encrypted_credentials IS NOT NULL AND credential_key_version IS NOT NULL)),
  UNIQUE (platform, provider_account_id)
);

CREATE TABLE IF NOT EXISTS ccpun_social.social_publication (
  id text PRIMARY KEY,
  master_content_id text NOT NULL,
  variant_id text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'youtube', 'tiktok', 'facebook-group')),
  format text NOT NULL CHECK (format IN ('text-post', 'image-post', 'carousel', 'comment-series', 'reel', 'video', 'short', 'photo-post')),
  publishing_mode text NOT NULL CHECK (publishing_mode IN ('direct', 'native-scheduled', 'native-finish', 'tiktok-draft', 'assisted-distribution')),
  status text NOT NULL CHECK (status IN ('draft', 'approved', 'queued', 'native-scheduled', 'awaiting-native-finish', 'processing', 'published', 'failed', 'cancelled', 'superseded')),
  scheduled_at timestamptz,
  platform_object_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (variant_id, platform)
);

CREATE TABLE IF NOT EXISTS ccpun_social.social_publication_job (
  id text PRIMARY KEY,
  publication_id text NOT NULL REFERENCES ccpun_social.social_publication(id),
  job_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('queued', 'processing', 'succeeded', 'failed', 'cancelled')),
  idempotency_key text NOT NULL UNIQUE,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  locked_at timestamptz,
  last_error_category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ccpun_social.social_comment_item (
  id text PRIMARY KEY,
  publication_id text NOT NULL REFERENCES ccpun_social.social_publication(id),
  position integer NOT NULL CHECK (position BETWEEN 1 AND 20),
  parent_item_id text REFERENCES ccpun_social.social_comment_item(id),
  status text NOT NULL CHECK (status IN ('draft', 'approved', 'queued', 'processing', 'published', 'failed', 'cancelled')),
  platform_comment_id text,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (publication_id, position)
);

CREATE TABLE IF NOT EXISTS ccpun_social.social_media_asset (
  id text PRIMARY KEY,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  width integer CHECK (width > 0),
  height integer CHECK (height > 0),
  duration_seconds numeric CHECK (duration_seconds >= 0),
  checksum text,
  storage_key text,
  lifecycle_state text NOT NULL CHECK (lifecycle_state IN ('metadata-only', 'available', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ccpun_social.social_execution_audit (
  id text PRIMARY KEY,
  actor text NOT NULL,
  action text NOT NULL,
  object_type text NOT NULL,
  object_id text NOT NULL,
  request_id text,
  outcome text NOT NULL CHECK (outcome IN ('allowed', 'denied', 'succeeded', 'failed')),
  occurred_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
