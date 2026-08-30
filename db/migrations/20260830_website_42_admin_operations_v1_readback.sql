WITH runtime_role AS (
  SELECT * FROM pg_roles WHERE rolname = 'ccpun_admin_runtime'
)
SELECT
  current_database() = 'neondb' AS database_ok,
  EXISTS (
    SELECT 1 FROM ccpun_admin.schema_migration
    WHERE version = '20260830_website_42_admin_operations_v1'
      AND checksum = 'sha256:51f16b563368488362408f323f95863ecf8f277b6b725b96189fedddf1300e4f'
  ) AS checksum_ok,
  EXISTS (
    SELECT 1 FROM ccpun_admin.system_identity
    WHERE singleton
      AND project_id = 'young-term-47483330'
      AND branch_id = 'br-crimson-mouse-az7ajkv8'
      AND endpoint_id = 'ep-mute-frost-aztvz394'
      AND database_name = 'neondb'
      AND migration_version = '20260830_website_42_admin_operations_v1'
      AND migration_checksum = 'sha256:51f16b563368488362408f323f95863ecf8f277b6b725b96189fedddf1300e4f'
  ) AS identity_ok,
  EXISTS (SELECT 1 FROM runtime_role) AS runtime_role_exists,
  EXISTS (
    SELECT 1 FROM runtime_role
    WHERE NOT rolcanlogin AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole
      AND NOT rolinherit AND NOT rolreplication AND NOT rolbypassrls
  ) AS runtime_role_restricted,
  has_database_privilege('ccpun_admin_runtime', 'neondb', 'CONNECT') AS database_connect_ok,
  has_schema_privilege('ccpun_admin_runtime', 'ccpun_admin', 'USAGE') AS admin_schema_usage_ok,
  NOT has_schema_privilege('ccpun_admin_runtime', 'ccpun_social', 'USAGE') AS social_schema_denied,
  has_table_privilege('ccpun_admin_runtime', 'ccpun_admin.audit_log', 'SELECT')
    AND has_table_privilege('ccpun_admin_runtime', 'ccpun_admin.audit_log', 'INSERT')
    AND NOT has_table_privilege('ccpun_admin_runtime', 'ccpun_admin.audit_log', 'UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
    AND has_table_privilege('ccpun_admin_runtime', 'ccpun_admin.research_snapshot', 'SELECT')
    AND has_table_privilege('ccpun_admin_runtime', 'ccpun_admin.research_snapshot', 'INSERT')
    AND NOT has_table_privilege('ccpun_admin_runtime', 'ccpun_admin.research_snapshot', 'UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
    AND has_table_privilege('ccpun_admin_runtime', 'ccpun_admin.seo_suggestion', 'SELECT')
    AND has_table_privilege('ccpun_admin_runtime', 'ccpun_admin.seo_suggestion', 'INSERT')
    AND NOT has_table_privilege('ccpun_admin_runtime', 'ccpun_admin.seo_suggestion', 'DELETE,TRUNCATE,REFERENCES,TRIGGER')
    AS admin_table_grants_ok,
  ARRAY(
    SELECT column_name::text FROM information_schema.role_column_grants
    WHERE grantee = 'ccpun_admin_runtime' AND table_schema = 'ccpun_admin'
      AND table_name = 'seo_suggestion' AND privilege_type = 'UPDATE'
    ORDER BY column_name
  ) = ARRAY[
    'after_value','apply_claimed_at','apply_request_id','apply_state','applied_at','applied_by',
    'applied_target_revision','approved_after','approved_base_value','approved_risk_level',
    'approved_target_id','approved_target_revision','approved_type','edited_at','edited_by','reason',
    'reconciliation_reason','rejection_reason','reviewed_at','reviewed_by','row_version','status','updated_at'
  ]::text[] AS seo_update_columns_ok,
  NOT EXISTS (
    SELECT 1
    FROM pg_class AS relation
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'ccpun_social'
      AND relation.relkind IN ('r','p','v','m','f')
      AND has_table_privilege(
        'ccpun_admin_runtime', format('%I.%I', namespace.nspname, relation.relname),
        'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
      )
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_class AS relation
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'ccpun_social'
      AND relation.relkind = 'S'
      AND has_sequence_privilege(
        'ccpun_admin_runtime', format('%I.%I', namespace.nspname, relation.relname), 'USAGE,SELECT,UPDATE'
      )
  ) AS social_objects_denied;
