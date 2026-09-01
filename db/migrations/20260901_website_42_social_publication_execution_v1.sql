BEGIN;

DO $migration_guard$
DECLARE
  current_checksum text;
  prerequisite_current boolean;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('ccpun_social:20260901_website_42_social_publication_execution_v1'));

  SELECT EXISTS (
    SELECT 1 FROM ccpun_social.schema_migration
    WHERE version = '20260831_website_42_social_analytics_ingestion'
      AND checksum = 'sha256:ea2ba4d0a028569cbc53cc2fe7cdcdb0ecfa1df3ae777ef7baadf9aa08b9950c'
  ) INTO prerequisite_current;
  IF NOT prerequisite_current THEN
    RAISE EXCEPTION 'CCPUN social execution prerequisite is not current';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM ccpun_social.system_identity
    WHERE singleton
      AND project_id = 'young-term-47483330'
      AND branch_id = 'br-crimson-mouse-az7ajkv8'
      AND endpoint_id = 'ep-mute-frost-aztvz394'
      AND database_name = 'neondb'
  ) THEN
    RAISE EXCEPTION 'CCPUN social execution target identity mismatch';
  END IF;

  SELECT checksum INTO current_checksum
  FROM ccpun_social.schema_migration
  WHERE version = '20260901_website_42_social_publication_execution_v1';

  IF current_checksum IS NOT NULL AND current_checksum <> 'sha256:9c9a95c3f29d0c912b6b0c226fea873569809f49ebc8f1a66ab32699bde85bba' THEN
    RAISE EXCEPTION 'CCPUN social execution migration checksum mismatch';
  END IF;

  IF current_checksum IS NULL AND (
    to_regclass('ccpun_social.social_mobile_handoff') IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'ccpun_social'
        AND ((table_name = 'social_publication' AND column_name = 'execution_target')
          OR (table_name = 'social_publication_job' AND column_name = 'version'))
    )
  ) THEN
    RAISE EXCEPTION 'CCPUN social execution schema exists without the current migration ledger';
  END IF;
END
$migration_guard$;

-- checksum-source-begin
ALTER TABLE ccpun_social.social_variant_link
  ADD COLUMN IF NOT EXISTS editorial_version integer;

ALTER TABLE ccpun_social.social_variant_link
  DROP CONSTRAINT IF EXISTS social_variant_link_editorial_version_check,
  DROP CONSTRAINT IF EXISTS social_variant_link_format_check;
ALTER TABLE ccpun_social.social_variant_link
  ADD CONSTRAINT social_variant_link_editorial_version_check
  CHECK (editorial_version IS NULL OR editorial_version >= 1) NOT VALID,
  ADD CONSTRAINT social_variant_link_format_check
  CHECK (format IN ('text-post', 'link-post', 'image-post', 'album', 'carousel', 'comment-series', 'reel', 'video', 'short', 'photo-post', 'live')) NOT VALID;

ALTER TABLE ccpun_social.social_publication
  ADD COLUMN IF NOT EXISTS execution_target text,
  ADD COLUMN IF NOT EXISTS approved_revision text,
  ADD COLUMN IF NOT EXISTS approved_version integer,
  ADD COLUMN IF NOT EXISTS approved_by_actor_ref text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_request_ref text;

ALTER TABLE ccpun_social.social_publication
  DROP CONSTRAINT IF EXISTS social_publication_execution_target_check,
  DROP CONSTRAINT IF EXISTS social_publication_approval_snapshot_check,
  DROP CONSTRAINT IF EXISTS social_publication_schedule_target_check;
ALTER TABLE ccpun_social.social_publication
  ADD CONSTRAINT social_publication_execution_target_check
    CHECK (execution_target IS NULL OR execution_target IN (
      'facebook-publish-now', 'facebook-native-scheduled',
      'instagram-publish-now', 'instagram-mobile-handoff'
    )) NOT VALID,
  ADD CONSTRAINT social_publication_approval_snapshot_check
    CHECK (
      (execution_target IS NULL AND approved_revision IS NULL AND approved_version IS NULL
        AND approved_by_actor_ref IS NULL AND approved_at IS NULL AND approval_request_ref IS NULL)
      OR
      (execution_target IS NOT NULL AND length(approved_revision) BETWEEN 1 AND 120
        AND approved_version >= 1
        AND approved_by_actor_ref ~ '^[A-Za-z0-9_.:-]{1,120}$'
        AND approved_at IS NOT NULL
        AND approval_request_ref ~ '^[A-Za-z0-9_.:-]{1,120}$')
    ) NOT VALID,
  ADD CONSTRAINT social_publication_schedule_target_check
    CHECK (
      (execution_target = 'facebook-native-scheduled' AND scheduled_at IS NOT NULL)
      OR (execution_target IS DISTINCT FROM 'facebook-native-scheduled' AND scheduled_at IS NULL)
    ) NOT VALID;

ALTER TABLE ccpun_social.social_publication_job
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS execution_target text;

ALTER TABLE ccpun_social.social_publication_job
  DROP CONSTRAINT IF EXISTS social_publication_job_version_check,
  DROP CONSTRAINT IF EXISTS social_publication_job_max_attempts_check,
  DROP CONSTRAINT IF EXISTS social_publication_job_execution_target_check,
  DROP CONSTRAINT IF EXISTS social_publication_job_type_target_check;
ALTER TABLE ccpun_social.social_publication_job
  ADD CONSTRAINT social_publication_job_version_check CHECK (version >= 1) NOT VALID,
  ADD CONSTRAINT social_publication_job_max_attempts_check CHECK (max_attempts BETWEEN 1 AND 10) NOT VALID,
  ADD CONSTRAINT social_publication_job_execution_target_check
    CHECK (execution_target IS NULL OR execution_target IN (
      'facebook-publish-now', 'facebook-native-scheduled',
      'instagram-publish-now', 'instagram-mobile-handoff'
    )) NOT VALID,
  ADD CONSTRAINT social_publication_job_type_target_check
    CHECK (
      execution_target IS NULL
      OR (job_type = 'native-handoff' AND execution_target = 'instagram-mobile-handoff')
      OR (job_type = 'publish' AND execution_target IN (
        'facebook-publish-now', 'facebook-native-scheduled', 'instagram-publish-now'
      ))
    ) NOT VALID;

CREATE UNIQUE INDEX IF NOT EXISTS social_publication_approved_snapshot_unique
ON ccpun_social.social_publication (variant_id,approved_revision,approved_version)
WHERE approved_revision IS NOT NULL AND approved_version IS NOT NULL;

CREATE TABLE IF NOT EXISTS ccpun_social.social_mobile_handoff (
  id text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 120),
  publication_id text NOT NULL UNIQUE REFERENCES ccpun_social.social_publication(id),
  variant_id text NOT NULL REFERENCES ccpun_social.social_variant_link(variant_id),
  approved_revision text NOT NULL CHECK (length(approved_revision) BETWEEN 1 AND 120),
  approved_version integer NOT NULL CHECK (approved_version >= 1),
  media_asset_ids jsonb NOT NULL CHECK (
    jsonb_typeof(media_asset_ids) = 'array'
    AND jsonb_array_length(media_asset_ids) <= 20
  ),
  status text NOT NULL CHECK (status IN ('ready', 'opened', 'completed', 'cancelled')),
  idempotency_key text NOT NULL UNIQUE CHECK (length(idempotency_key) BETWEEN 16 AND 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL PRIVILEGES ON
  ccpun_social.social_variant_link,
  ccpun_social.social_variant_media,
  ccpun_social.social_publication,
  ccpun_social.social_publication_job,
  ccpun_social.social_mobile_handoff,
  ccpun_social.social_execution_audit
FROM ccpun_social_runtime;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ccpun_social FROM ccpun_social_runtime;
REVOKE ALL PRIVILEGES ON SCHEMA ccpun_social FROM ccpun_social_runtime;
GRANT USAGE ON SCHEMA ccpun_social TO ccpun_social_runtime;
REVOKE ALL PRIVILEGES ON DATABASE neondb FROM ccpun_social_runtime;
GRANT CONNECT ON DATABASE neondb TO ccpun_social_runtime;
GRANT SELECT ON
  ccpun_social.social_variant_link,
  ccpun_social.social_variant_media,
  ccpun_social.social_publication,
  ccpun_social.social_publication_job,
  ccpun_social.social_mobile_handoff
TO ccpun_social_runtime;
GRANT INSERT ON
  ccpun_social.social_variant_link,
  ccpun_social.social_publication,
  ccpun_social.social_publication_job,
  ccpun_social.social_mobile_handoff,
  ccpun_social.social_execution_audit
TO ccpun_social_runtime;
GRANT UPDATE (editorial_revision, editorial_version, format, publishing_mode, updated_at)
ON ccpun_social.social_variant_link TO ccpun_social_runtime;
GRANT UPDATE (
  status, scheduled_at, execution_target, approved_by_actor_ref, approved_at,
  approval_request_ref, platform_object_id, published_at, updated_at
)
ON ccpun_social.social_publication TO ccpun_social_runtime;
GRANT UPDATE (
  status, version, attempt_count, lock_owner, locked_at, lock_expires_at,
  execution_target, last_error_category, last_error_ref, updated_at
) ON ccpun_social.social_publication_job TO ccpun_social_runtime;
GRANT UPDATE (status, updated_at)
ON ccpun_social.social_mobile_handoff TO ccpun_social_runtime;
-- checksum-source-end

INSERT INTO ccpun_social.schema_migration (version, checksum)
VALUES (
  '20260901_website_42_social_publication_execution_v1',
  'sha256:9c9a95c3f29d0c912b6b0c226fea873569809f49ebc8f1a66ab32699bde85bba'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
