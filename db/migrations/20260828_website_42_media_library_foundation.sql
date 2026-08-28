BEGIN;

DO $migration_guard$
DECLARE
  current_checksum text;
  social_foundation_current boolean;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('ccpun_social:20260828_website_42_media_library_foundation'));

  SELECT EXISTS (
    SELECT 1
    FROM ccpun_social.schema_migration
    WHERE version = '20260828_website_42_social_foundation_v2'
      AND checksum = 'sha256:b6ad0b823775df1dcfc06e0da896dfcc477cfbeae897b70e228c18a051712acb'
  ) INTO social_foundation_current;

  IF NOT social_foundation_current THEN
    RAISE EXCEPTION 'CCPUN social foundation migration is required first';
  END IF;

  SELECT checksum INTO current_checksum
  FROM ccpun_social.schema_migration
  WHERE version = '20260828_website_42_media_library_foundation';

  IF current_checksum IS NOT NULL AND current_checksum <> 'sha256:9c5a76125a6cecc90a1693aabd7925c04f8473de0fa0d3206b6188fb427bfb55' THEN
    RAISE EXCEPTION 'CCPUN media migration checksum mismatch';
  END IF;

  IF current_checksum IS NULL AND (
    to_regclass('ccpun_social.media_storage_object') IS NOT NULL OR
    to_regclass('ccpun_social.media_upload_session') IS NOT NULL OR
    to_regclass('ccpun_social.social_variant_media') IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'CCPUN media schema exists without the current migration ledger';
  END IF;
END
$migration_guard$;

-- checksum-source-begin
CREATE TABLE IF NOT EXISTS ccpun_social.media_storage_object (
  asset_id text PRIMARY KEY REFERENCES ccpun_social.social_media_asset(id),
  provider text NOT NULL CHECK (provider ~ '^[a-z0-9-]{1,80}$'),
  bucket_or_store text NOT NULL CHECK (length(bucket_or_store) BETWEEN 1 AND 200),
  object_key text NOT NULL CHECK (length(object_key) BETWEEN 1 AND 1024),
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'text/vtt')),
  byte_size bigint NOT NULL CHECK (byte_size BETWEEN 1 AND 5000000000),
  checksum_sha256 text NOT NULL CHECK (checksum_sha256 ~ '^[0-9a-f]{64}$'),
  etag text CHECK (etag IS NULL OR length(etag) BETWEEN 1 AND 200),
  visibility text NOT NULL CHECK (visibility IN ('private', 'public-delivery')),
  status text NOT NULL CHECK (status IN ('pending', 'verified', 'quarantined', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, bucket_or_store, object_key)
);

CREATE TABLE IF NOT EXISTS ccpun_social.media_upload_session (
  id text PRIMARY KEY,
  asset_id text NOT NULL REFERENCES ccpun_social.social_media_asset(id),
  provider text NOT NULL CHECK (provider ~ '^[a-z0-9-]{1,80}$'),
  status text NOT NULL CHECK (status IN ('requested', 'authorized', 'uploading', 'uploaded', 'verified', 'failed', 'expired', 'cancelled')),
  upload_method text NOT NULL CHECK (upload_method = 'direct'),
  idempotency_key text NOT NULL UNIQUE,
  provider_session_ref text CHECK (provider_session_ref IS NULL OR length(provider_session_ref) BETWEEN 1 AND 200),
  expected_mime_type text NOT NULL CHECK (expected_mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'text/vtt')),
  expected_byte_size bigint NOT NULL CHECK (expected_byte_size BETWEEN 1 AND 5000000000),
  expected_checksum_sha256 text NOT NULL CHECK (expected_checksum_sha256 ~ '^[0-9a-f]{64}$'),
  actor_ref text NOT NULL CHECK (length(actor_ref) BETWEEN 1 AND 200),
  request_ref text NOT NULL CHECK (request_ref ~ '^[A-Za-z0-9_.:-]{1,120}$'),
  expires_at timestamptz NOT NULL,
  last_error_category text CHECK (last_error_category IN ('authentication', 'authorization', 'rate-limit', 'timeout', 'provider-unavailable', 'invalid-request', 'conflict', 'unknown')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(id) BETWEEN 1 AND 120),
  CHECK (length(idempotency_key) BETWEEN 16 AND 200),
  CHECK (expires_at > created_at),
  CHECK (status NOT IN ('authorized', 'uploading', 'uploaded', 'verified') OR provider_session_ref IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS ccpun_social.social_variant_media (
  variant_id text NOT NULL REFERENCES ccpun_social.social_variant_link(variant_id),
  asset_id text NOT NULL REFERENCES ccpun_social.social_media_asset(id),
  role text NOT NULL CHECK (role IN ('primary', 'carousel-item', 'cover', 'thumbnail', 'caption')),
  position integer CHECK (position BETWEEN 1 AND 20),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (variant_id, asset_id, role),
  UNIQUE (variant_id, role, position),
  CHECK ((role = 'carousel-item') = (position IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS social_variant_media_singleton_role_idx
  ON ccpun_social.social_variant_media (variant_id, role)
  WHERE position IS NULL;
-- checksum-source-end

INSERT INTO ccpun_social.schema_migration (version, checksum)
VALUES (
  '20260828_website_42_media_library_foundation',
  'sha256:9c5a76125a6cecc90a1693aabd7925c04f8473de0fa0d3206b6188fb427bfb55'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
