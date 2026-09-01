BEGIN;

DO $migration_guard$
DECLARE
  current_checksum text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('ccpun_social:20260901_website_42_social_comment_execution_v1'));

  IF NOT EXISTS (
    SELECT 1 FROM ccpun_social.schema_migration
    WHERE version = '20260901_website_42_social_publication_execution_v1'
      AND checksum = 'sha256:9c9a95c3f29d0c912b6b0c226fea873569809f49ebc8f1a66ab32699bde85bba'
  ) THEN
    RAISE EXCEPTION 'CCPUN comment execution prerequisite is not current';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM ccpun_social.system_identity
    WHERE singleton
      AND project_id = 'young-term-47483330'
      AND branch_id = 'br-crimson-mouse-az7ajkv8'
      AND endpoint_id = 'ep-mute-frost-aztvz394'
      AND database_name = 'neondb'
  ) THEN
    RAISE EXCEPTION 'CCPUN comment execution target identity mismatch';
  END IF;

  SELECT checksum INTO current_checksum
  FROM ccpun_social.schema_migration
  WHERE version = '20260901_website_42_social_comment_execution_v1';

  IF current_checksum IS NOT NULL AND current_checksum <> 'sha256:c9a5512469d8894ccbdebf5c051d7471aef1f9d59973b6a71f5d0f2b7618155d' THEN
    RAISE EXCEPTION 'CCPUN comment execution migration checksum mismatch';
  END IF;
END
$migration_guard$;

-- checksum-source-begin
REVOKE ALL PRIVILEGES ON ccpun_social.social_comment_item FROM ccpun_social_runtime;
GRANT SELECT, INSERT ON ccpun_social.social_comment_item TO ccpun_social_runtime;
GRANT UPDATE (status, platform_comment_id, updated_at)
ON ccpun_social.social_comment_item TO ccpun_social_runtime;
-- checksum-source-end

INSERT INTO ccpun_social.schema_migration (version, checksum)
VALUES (
  '20260901_website_42_social_comment_execution_v1',
  'sha256:c9a5512469d8894ccbdebf5c051d7471aef1f9d59973b6a71f5d0f2b7618155d'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
