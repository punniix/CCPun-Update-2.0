WITH runtime_role AS (
  SELECT * FROM pg_roles WHERE rolname = 'ccpun_social_runtime'
)
SELECT
  current_database() = 'neondb' AS database_ok,
  EXISTS (
    SELECT 1 FROM ccpun_social.schema_migration
    WHERE version = '20260831_website_42_social_analytics_ingestion'
      AND checksum = 'sha256:ea2ba4d0a028569cbc53cc2fe7cdcdb0ecfa1df3ae777ef7baadf9aa08b9950c'
  ) AS checksum_ok,
  EXISTS (
    SELECT 1 FROM ccpun_social.system_identity
    WHERE singleton
      AND project_id = 'young-term-47483330'
      AND branch_id = 'br-crimson-mouse-az7ajkv8'
      AND endpoint_id = 'ep-mute-frost-aztvz394'
      AND database_name = 'neondb'
      AND migration_version = '20260831_website_42_social_analytics_ingestion'
      AND migration_checksum = 'sha256:ea2ba4d0a028569cbc53cc2fe7cdcdb0ecfa1df3ae777ef7baadf9aa08b9950c'
  ) AS identity_ok,
  EXISTS (
    SELECT 1 FROM runtime_role
    WHERE rolcanlogin AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole
      AND NOT rolinherit AND NOT rolreplication AND NOT rolbypassrls
  ) AS runtime_role_restricted,
  has_database_privilege('ccpun_social_runtime', 'neondb', 'CONNECT') AS database_connect_ok,
  has_schema_privilege('ccpun_social_runtime', 'ccpun_social', 'USAGE') AS schema_usage_ok,
  has_table_privilege('ccpun_social_runtime', 'ccpun_social.schema_migration', 'SELECT')
    AND has_table_privilege('ccpun_social_runtime', 'ccpun_social.system_identity', 'SELECT')
    AND has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_variant_link', 'SELECT')
    AND has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_publication', 'SELECT')
    AND has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_metric_snapshot', 'SELECT,INSERT')
    AND has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_provider_sync_state', 'SELECT,INSERT')
    AND has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_execution_audit', 'INSERT')
    AS required_grants_ok,
  ARRAY(
    SELECT column_name::text
    FROM information_schema.role_column_grants
    WHERE grantee = 'ccpun_social_runtime'
      AND table_schema = 'ccpun_social'
      AND table_name = 'social_provider_sync_state'
      AND privilege_type = 'UPDATE'
    ORDER BY column_name::text
  ) = ARRAY['cursor','last_attempt_at','last_error_category','last_success_at','status','updated_at']::text[]
    AS sync_update_columns_ok,
  NOT EXISTS (
    SELECT 1
    FROM pg_class AS relation
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'ccpun_social'
      AND relation.relkind IN ('r','p','v','m','f')
      AND relation.relname NOT IN (
        'schema_migration','system_identity','social_variant_link','social_publication',
        'social_metric_snapshot','social_provider_sync_state','social_execution_audit'
      )
      AND has_table_privilege(
        'ccpun_social_runtime', relation.oid,
        'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
      )
  ) AS unrelated_tables_denied,
  NOT EXISTS (
    SELECT 1
    FROM pg_class AS relation
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'ccpun_social'
      AND CASE
        WHEN relation.relkind = 'S'
          THEN has_sequence_privilege('ccpun_social_runtime', relation.oid, 'USAGE,SELECT,UPDATE')
        ELSE false
      END
  ) AS sequences_denied,
  NOT has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_metric_snapshot', 'UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
    AND NOT has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_provider_sync_state', 'DELETE,TRUNCATE,REFERENCES,TRIGGER')
    AND NOT has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_execution_audit', 'SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
    AS unsafe_grants_denied;
