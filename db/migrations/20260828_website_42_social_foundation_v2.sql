BEGIN;

CREATE SCHEMA IF NOT EXISTS ccpun_social;

CREATE TABLE IF NOT EXISTS ccpun_social.schema_migration (
  version text PRIMARY KEY,
  checksum text NOT NULL CHECK (checksum ~ '^sha256:[0-9a-f]{64}$'),
  applied_at timestamptz NOT NULL DEFAULT now()
);

DO $migration_guard$
DECLARE
  current_checksum text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('ccpun_social:20260828_website_42_social_foundation_v2'));
  SELECT checksum INTO current_checksum
  FROM ccpun_social.schema_migration
  WHERE version = '20260828_website_42_social_foundation_v2';

  IF current_checksum IS NOT NULL AND current_checksum <> 'sha256:9d6c4a57b7b7781135d64e32253618c4c949effa13d10e65034f2ff05c641806' THEN
    RAISE EXCEPTION 'CCPUN social migration checksum mismatch';
  END IF;

  IF current_checksum IS NULL AND (
    to_regclass('ccpun_social.social_variant_link') IS NOT NULL OR
    to_regclass('ccpun_social.social_publication') IS NOT NULL OR
    to_regclass('ccpun_social.social_publication_job') IS NOT NULL OR
    to_regclass('ccpun_social.social_comment_item') IS NOT NULL OR
    to_regclass('ccpun_social.social_execution_audit') IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'CCPUN social schema exists without the current migration ledger';
  END IF;
END
$migration_guard$;

-- checksum-source-begin
CREATE TABLE IF NOT EXISTS ccpun_social.social_variant_link (
  variant_id text PRIMARY KEY,
  master_content_id text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('facebook', 'instagram', 'youtube', 'tiktok', 'facebook-group')),
  format text NOT NULL CHECK (format IN ('text-post', 'image-post', 'carousel', 'comment-series', 'reel', 'video', 'short', 'photo-post')),
  publishing_mode text NOT NULL CHECK (publishing_mode IN ('direct', 'native-scheduled', 'native-finish', 'tiktok-draft', 'assisted-distribution')),
  editorial_revision text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(variant_id) BETWEEN 1 AND 120),
  CHECK (length(master_content_id) BETWEEN 1 AND 120),
  CHECK (length(editorial_revision) BETWEEN 1 AND 120)
);

CREATE TABLE IF NOT EXISTS ccpun_social.social_publication (
  id text PRIMARY KEY,
  variant_id text NOT NULL REFERENCES ccpun_social.social_variant_link(variant_id),
  status text NOT NULL CHECK (status IN ('draft', 'approved', 'queued', 'native-scheduled', 'awaiting-native-finish', 'processing', 'published', 'failed', 'cancelled', 'superseded')),
  idempotency_key text NOT NULL UNIQUE,
  scheduled_at timestamptz,
  platform_object_id text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(id) BETWEEN 1 AND 120),
  CHECK (length(idempotency_key) BETWEEN 16 AND 200),
  CHECK (platform_object_id IS NULL OR length(platform_object_id) BETWEEN 1 AND 200),
  CHECK (status <> 'published' OR (platform_object_id IS NOT NULL AND published_at IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS ccpun_social.social_publication_job (
  id text PRIMARY KEY,
  publication_id text NOT NULL REFERENCES ccpun_social.social_publication(id),
  job_type text NOT NULL CHECK (job_type IN ('native-handoff', 'publish', 'status-sync', 'analytics-sync', 'comment-series')),
  status text NOT NULL CHECK (status IN ('queued', 'processing', 'succeeded', 'failed', 'cancelled')),
  idempotency_key text NOT NULL UNIQUE,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 10),
  lock_owner text,
  locked_at timestamptz,
  lock_expires_at timestamptz,
  last_error_category text CHECK (last_error_category IN ('authentication', 'authorization', 'rate-limit', 'timeout', 'provider-unavailable', 'invalid-request', 'conflict', 'unknown')),
  last_error_ref text CHECK (last_error_ref ~ '^[A-Za-z0-9_.:-]{1,120}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(id) BETWEEN 1 AND 120),
  CHECK (length(idempotency_key) BETWEEN 16 AND 200),
  CHECK (lock_owner IS NULL OR lock_owner ~ '^[A-Za-z0-9_.:-]{1,120}$'),
  CHECK (
    (lock_owner IS NULL AND locked_at IS NULL AND lock_expires_at IS NULL) OR
    (lock_owner IS NOT NULL AND locked_at IS NOT NULL AND lock_expires_at > locked_at)
  )
);

CREATE TABLE IF NOT EXISTS ccpun_social.social_comment_item (
  id text NOT NULL,
  publication_id text NOT NULL REFERENCES ccpun_social.social_publication(id),
  position integer NOT NULL CHECK (position BETWEEN 1 AND 20),
  parent_item_id text,
  status text NOT NULL CHECK (status IN ('draft', 'approved', 'queued', 'processing', 'published', 'failed', 'cancelled')),
  idempotency_key text NOT NULL UNIQUE,
  platform_comment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (id, publication_id),
  UNIQUE (publication_id, position),
  FOREIGN KEY (parent_item_id, publication_id)
    REFERENCES ccpun_social.social_comment_item(id, publication_id),
  CHECK (length(id) BETWEEN 1 AND 120),
  CHECK (parent_item_id IS NULL OR parent_item_id <> id),
  CHECK (length(idempotency_key) BETWEEN 16 AND 200),
  CHECK (platform_comment_id IS NULL OR length(platform_comment_id) BETWEEN 1 AND 200),
  CHECK (status <> 'published' OR platform_comment_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS ccpun_social.social_execution_audit (
  id text PRIMARY KEY,
  actor_type text NOT NULL CHECK (actor_type IN ('human', 'system')),
  actor_ref text NOT NULL CHECK (actor_ref ~ '^[A-Za-z0-9_.:-]{1,120}$'),
  action text NOT NULL CHECK (action ~ '^[a-z0-9:-]{1,80}$'),
  object_type text NOT NULL CHECK (object_type IN ('variant-link', 'publication', 'job', 'comment')),
  object_id text NOT NULL CHECK (length(object_id) BETWEEN 1 AND 120),
  request_ref text CHECK (request_ref ~ '^[A-Za-z0-9_.:-]{1,120}$'),
  outcome text NOT NULL CHECK (outcome IN ('allowed', 'denied', 'succeeded', 'failed')),
  occurred_at timestamptz NOT NULL DEFAULT now()
);
-- checksum-source-end

INSERT INTO ccpun_social.schema_migration (version, checksum)
VALUES (
  '20260828_website_42_social_foundation_v2',
  'sha256:9d6c4a57b7b7781135d64e32253618c4c949effa13d10e65034f2ff05c641806'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
