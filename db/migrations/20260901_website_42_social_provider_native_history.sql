BEGIN;

DO $migration_guard$
DECLARE
  current_checksum text;
  prerequisite_current boolean;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('ccpun_social:20260901_website_42_social_provider_native_history'));

  SELECT EXISTS (
    SELECT 1 FROM ccpun_social.schema_migration
    WHERE version = '20260831_website_42_social_analytics_ingestion'
      AND checksum = 'sha256:ea2ba4d0a028569cbc53cc2fe7cdcdb0ecfa1df3ae777ef7baadf9aa08b9950c'
  ) INTO prerequisite_current;
  IF NOT prerequisite_current THEN
    RAISE EXCEPTION 'CCPUN provider history prerequisite is not current';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM ccpun_social.system_identity
    WHERE singleton
      AND project_id = 'young-term-47483330'
      AND branch_id = 'br-crimson-mouse-az7ajkv8'
      AND endpoint_id = 'ep-mute-frost-aztvz394'
      AND database_name = 'neondb'
  ) THEN
    RAISE EXCEPTION 'CCPUN provider history target identity mismatch';
  END IF;

  SELECT checksum INTO current_checksum
  FROM ccpun_social.schema_migration
  WHERE version = '20260901_website_42_social_provider_native_history';

  IF current_checksum IS NOT NULL AND current_checksum <> 'sha256:cc4c2516ad261983d3d3997796711fb9b0290afe8625ab82fc002f4536bc549c' THEN
    RAISE EXCEPTION 'CCPUN provider history migration checksum mismatch';
  END IF;

  IF current_checksum IS NULL AND (
    to_regclass('ccpun_social.social_provider_content') IS NOT NULL OR
    to_regclass('ccpun_social.social_provider_content_revision') IS NOT NULL OR
    to_regclass('ccpun_social.social_provider_metric_snapshot') IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'ccpun_social' AND table_name = 'social_provider_sync_state'
        AND column_name IN ('backfill_completed_at', 'last_window_start_at')
    )
  ) THEN
    RAISE EXCEPTION 'CCPUN provider history schema exists without the current migration ledger';
  END IF;
END
$migration_guard$;

-- checksum-source-begin
CREATE TABLE IF NOT EXISTS ccpun_social.social_provider_content (
  id text PRIMARY KEY CHECK (id ~ '^provider-content:[0-9a-f]{64}$'),
  provider text NOT NULL CHECK (provider IN ('meta', 'youtube', 'tiktok')),
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'youtube', 'tiktok')),
  provider_account_id text NOT NULL CHECK (length(provider_account_id) BETWEEN 1 AND 200),
  provider_object_id text NOT NULL CHECK (length(provider_object_id) BETWEEN 1 AND 200),
  linked_publication_id text REFERENCES ccpun_social.social_publication(id),
  published_at timestamptz NOT NULL,
  text_content text NOT NULL CHECK (length(text_content) <= 50000),
  media_type text NOT NULL CHECK (length(media_type) BETWEEN 1 AND 80),
  permalink_url text CHECK (permalink_url IS NULL OR length(permalink_url) BETWEEN 1 AND 1000),
  thumbnail_url text CHECK (thumbnail_url IS NULL OR length(thumbnail_url) BETWEEN 1 AND 2000),
  latest_content_hash text NOT NULL CHECK (latest_content_hash ~ '^[0-9a-f]{64}$'),
  first_seen_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, platform, provider_object_id),
  CHECK (last_seen_at >= first_seen_at)
);

CREATE TABLE IF NOT EXISTS ccpun_social.social_provider_content_revision (
  id text PRIMARY KEY CHECK (id ~ '^provider-revision:[0-9a-f]{64}$'),
  content_id text NOT NULL REFERENCES ccpun_social.social_provider_content(id),
  content_hash text NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  captured_at timestamptz NOT NULL,
  text_content text NOT NULL CHECK (length(text_content) <= 50000),
  media_type text NOT NULL CHECK (length(media_type) BETWEEN 1 AND 80),
  permalink_url text CHECK (permalink_url IS NULL OR length(permalink_url) BETWEEN 1 AND 1000),
  thumbnail_url text CHECK (thumbnail_url IS NULL OR length(thumbnail_url) BETWEEN 1 AND 2000),
  UNIQUE (content_id, content_hash)
);

CREATE TABLE IF NOT EXISTS ccpun_social.social_provider_metric_snapshot (
  id text PRIMARY KEY CHECK (id ~ '^provider-metric:[0-9a-f]{64}$'),
  content_id text NOT NULL REFERENCES ccpun_social.social_provider_content(id),
  provider text NOT NULL CHECK (provider IN ('meta', 'youtube', 'tiktok')),
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'youtube', 'tiktok')),
  provider_object_id text NOT NULL CHECK (length(provider_object_id) BETWEEN 1 AND 200),
  fetched_at timestamptz NOT NULL,
  metrics_hash text NOT NULL CHECK (metrics_hash ~ '^[0-9a-f]{64}$'),
  native_metrics jsonb NOT NULL CHECK (jsonb_typeof(native_metrics) = 'array' AND jsonb_array_length(native_metrics) BETWEEN 1 AND 20),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_id, metrics_hash)
);

ALTER TABLE ccpun_social.social_provider_sync_state
  ADD COLUMN IF NOT EXISTS backfill_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_window_start_at timestamptz;

REVOKE ALL PRIVILEGES ON
  ccpun_social.social_provider_content,
  ccpun_social.social_provider_content_revision,
  ccpun_social.social_provider_metric_snapshot
FROM ccpun_social_runtime;
GRANT SELECT, INSERT ON
  ccpun_social.social_provider_content,
  ccpun_social.social_provider_content_revision,
  ccpun_social.social_provider_metric_snapshot
TO ccpun_social_runtime;
GRANT UPDATE (
  linked_publication_id, published_at, text_content, media_type, permalink_url,
  thumbnail_url, latest_content_hash, last_seen_at, updated_at
) ON ccpun_social.social_provider_content TO ccpun_social_runtime;
GRANT UPDATE (
  cursor, status, last_attempt_at, last_success_at, last_error_category,
  backfill_completed_at, last_window_start_at, updated_at
) ON ccpun_social.social_provider_sync_state TO ccpun_social_runtime;
-- checksum-source-end

INSERT INTO ccpun_social.schema_migration (version, checksum)
VALUES (
  '20260901_website_42_social_provider_native_history',
  'sha256:cc4c2516ad261983d3d3997796711fb9b0290afe8625ab82fc002f4536bc549c'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
