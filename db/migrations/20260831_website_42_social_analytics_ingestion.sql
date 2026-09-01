BEGIN;

DO $migration_guard$
DECLARE
  current_checksum text;
  prerequisites_current boolean;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('ccpun_social:20260831_website_42_social_analytics_ingestion'));

  SELECT count(*) = 3 INTO prerequisites_current
  FROM ccpun_social.schema_migration
  WHERE (version, checksum) IN (
    ('20260828_website_42_social_foundation_v2', 'sha256:b6ad0b823775df1dcfc06e0da896dfcc477cfbeae897b70e228c18a051712acb'),
    ('20260828_website_42_media_library_foundation', 'sha256:9c5a76125a6cecc90a1693aabd7925c04f8473de0fa0d3206b6188fb427bfb55'),
    ('20260829_website_42_social_post_formats', 'sha256:64d8471247fa28a08fcb99cda5b4df87e73f7ed1dc497250da26d01119ade977')
  );

  IF NOT prerequisites_current THEN
    RAISE EXCEPTION 'CCPUN social analytics prerequisites are not current';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ccpun_social_runtime') THEN
    RAISE EXCEPTION 'CCPUN social runtime role must be inventoried before this migration';
  END IF;

  SELECT checksum INTO current_checksum
  FROM ccpun_social.schema_migration
  WHERE version = '20260831_website_42_social_analytics_ingestion';

  IF current_checksum IS NOT NULL AND current_checksum <> 'sha256:ea2ba4d0a028569cbc53cc2fe7cdcdb0ecfa1df3ae777ef7baadf9aa08b9950c' THEN
    RAISE EXCEPTION 'CCPUN social analytics migration checksum mismatch';
  END IF;

  IF current_checksum IS NULL AND (
    to_regclass('ccpun_social.system_identity') IS NOT NULL OR
    to_regclass('ccpun_social.social_metric_snapshot') IS NOT NULL OR
    to_regclass('ccpun_social.social_provider_sync_state') IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'CCPUN social analytics schema exists without the current migration ledger';
  END IF;
END
$migration_guard$;

-- checksum-source-begin
CREATE TABLE IF NOT EXISTS ccpun_social.system_identity (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  project_id text NOT NULL CHECK (project_id = 'young-term-47483330'),
  branch_id text NOT NULL CHECK (branch_id = 'br-crimson-mouse-az7ajkv8'),
  endpoint_id text NOT NULL CHECK (endpoint_id = 'ep-mute-frost-aztvz394'),
  database_name text NOT NULL CHECK (database_name = 'neondb'),
  migration_version text NOT NULL CHECK (migration_version = '20260831_website_42_social_analytics_ingestion'),
  migration_checksum text NOT NULL CHECK (migration_checksum ~ '^sha256:[0-9a-f]{64}$'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ccpun_social.social_metric_snapshot (
  id text PRIMARY KEY CHECK (id ~ '^metric:[0-9a-f]{64}$'),
  publication_id text NOT NULL REFERENCES ccpun_social.social_publication(id),
  provider text NOT NULL CHECK (provider IN ('meta', 'youtube', 'tiktok')),
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'youtube', 'tiktok')),
  platform_object_id text NOT NULL CHECK (length(platform_object_id) BETWEEN 1 AND 200),
  collection_mode text NOT NULL CHECK (collection_mode = 'manual-provider-read'),
  fetched_at timestamptz NOT NULL,
  native_metrics jsonb NOT NULL CHECK (jsonb_typeof(native_metrics) = 'array' AND jsonb_array_length(native_metrics) BETWEEN 1 AND 20),
  limitations jsonb NOT NULL CHECK (jsonb_typeof(limitations) = 'array' AND jsonb_array_length(limitations) BETWEEN 1 AND 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (publication_id, provider, fetched_at)
);

CREATE TABLE IF NOT EXISTS ccpun_social.social_provider_sync_state (
  provider text NOT NULL CHECK (provider IN ('meta', 'youtube', 'tiktok')),
  provider_account_id text NOT NULL CHECK (length(provider_account_id) BETWEEN 1 AND 200),
  cursor text CHECK (cursor IS NULL OR length(cursor) BETWEEN 1 AND 500),
  status text NOT NULL CHECK (status IN ('connected', 'refresh-required', 'revoked', 'error')),
  last_attempt_at timestamptz NOT NULL,
  last_success_at timestamptz,
  last_error_category text CHECK (last_error_category IN ('authentication', 'authorization', 'rate-limit', 'timeout', 'provider-unavailable', 'invalid-response', 'unknown')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, provider_account_id),
  CHECK ((status = 'connected') = (last_success_at IS NOT NULL AND last_error_category IS NULL))
);

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA ccpun_social FROM ccpun_social_runtime;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ccpun_social FROM ccpun_social_runtime;
GRANT CONNECT ON DATABASE neondb TO ccpun_social_runtime;
GRANT USAGE ON SCHEMA ccpun_social TO ccpun_social_runtime;
GRANT SELECT ON
  ccpun_social.schema_migration,
  ccpun_social.system_identity,
  ccpun_social.social_variant_link,
  ccpun_social.social_publication,
  ccpun_social.social_metric_snapshot,
  ccpun_social.social_provider_sync_state
TO ccpun_social_runtime;
GRANT INSERT ON
  ccpun_social.social_metric_snapshot,
  ccpun_social.social_provider_sync_state,
  ccpun_social.social_execution_audit
TO ccpun_social_runtime;
GRANT UPDATE (cursor, status, last_attempt_at, last_success_at, last_error_category, updated_at)
ON ccpun_social.social_provider_sync_state TO ccpun_social_runtime;
-- checksum-source-end

INSERT INTO ccpun_social.system_identity (
  singleton, project_id, branch_id, endpoint_id, database_name, migration_version, migration_checksum
) VALUES (
  true,
  'young-term-47483330',
  'br-crimson-mouse-az7ajkv8',
  'ep-mute-frost-aztvz394',
  'neondb',
  '20260831_website_42_social_analytics_ingestion',
  'sha256:ea2ba4d0a028569cbc53cc2fe7cdcdb0ecfa1df3ae777ef7baadf9aa08b9950c'
)
ON CONFLICT (singleton) DO UPDATE SET
  project_id = EXCLUDED.project_id,
  branch_id = EXCLUDED.branch_id,
  endpoint_id = EXCLUDED.endpoint_id,
  database_name = EXCLUDED.database_name,
  migration_version = EXCLUDED.migration_version,
  migration_checksum = EXCLUDED.migration_checksum,
  updated_at = now();

INSERT INTO ccpun_social.schema_migration (version, checksum)
VALUES (
  '20260831_website_42_social_analytics_ingestion',
  'sha256:ea2ba4d0a028569cbc53cc2fe7cdcdb0ecfa1df3ae777ef7baadf9aa08b9950c'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
