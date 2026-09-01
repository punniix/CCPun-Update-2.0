WITH runtime_role AS (
  SELECT * FROM pg_roles WHERE rolname = 'ccpun_social_runtime'
)
SELECT
  current_database() = 'neondb' AS database_ok,
  EXISTS (
    SELECT 1 FROM ccpun_social.schema_migration
    WHERE version = '20260901_website_42_social_provider_native_history'
      AND checksum = 'sha256:cc4c2516ad261983d3d3997796711fb9b0290afe8625ab82fc002f4536bc549c'
  ) AS checksum_ok,
  EXISTS (
    SELECT 1 FROM ccpun_social.system_identity
    WHERE singleton
      AND project_id = 'young-term-47483330'
      AND branch_id = 'br-crimson-mouse-az7ajkv8'
      AND endpoint_id = 'ep-mute-frost-aztvz394'
      AND database_name = 'neondb'
  ) AS identity_ok,
  EXISTS (
    SELECT 1 FROM runtime_role
    WHERE rolcanlogin AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole
      AND NOT rolinherit AND NOT rolreplication AND NOT rolbypassrls
  ) AS runtime_role_restricted,
  to_regclass('ccpun_social.social_provider_content') IS NOT NULL
    AND to_regclass('ccpun_social.social_provider_content_revision') IS NOT NULL
    AND to_regclass('ccpun_social.social_provider_metric_snapshot') IS NOT NULL
    AS provider_tables_ok,
  has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_provider_content', 'SELECT,INSERT')
    AND has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_provider_content_revision', 'SELECT,INSERT')
    AND has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_provider_metric_snapshot', 'SELECT,INSERT')
    AS provider_insert_grants_ok,
  ARRAY(
    SELECT column_name::text
    FROM information_schema.role_column_grants
    WHERE grantee = 'ccpun_social_runtime'
      AND table_schema = 'ccpun_social'
      AND table_name = 'social_provider_content'
      AND privilege_type = 'UPDATE'
    ORDER BY column_name::text
  ) = ARRAY['last_seen_at','latest_content_hash','linked_publication_id','media_type','permalink_url','published_at','text_content','thumbnail_url','updated_at']::text[]
    AS content_update_columns_ok,
  ARRAY(
    SELECT column_name::text
    FROM information_schema.role_column_grants
    WHERE grantee = 'ccpun_social_runtime'
      AND table_schema = 'ccpun_social'
      AND table_name = 'social_provider_sync_state'
      AND privilege_type = 'UPDATE'
    ORDER BY column_name::text
  ) = ARRAY['backfill_completed_at','cursor','last_attempt_at','last_error_category','last_success_at','last_window_start_at','status','updated_at']::text[]
    AS sync_update_columns_ok,
  NOT has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_provider_content', 'DELETE,TRUNCATE,REFERENCES,TRIGGER')
    AND NOT has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_provider_content_revision', 'UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
    AND NOT has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_provider_metric_snapshot', 'UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
    AS unsafe_grants_denied;
