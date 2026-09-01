BEGIN READ ONLY;

SELECT current_database() AS database_name, current_user AS role_name;

SELECT version, checksum, applied_at
FROM ccpun_social.schema_migration
WHERE version = '20260901_website_42_social_publication_execution_v1'
  AND checksum = 'sha256:9c9a95c3f29d0c912b6b0c226fea873569809f49ebc8f1a66ab32699bde85bba';

SELECT project_id, branch_id, endpoint_id, database_name
FROM ccpun_social.system_identity
WHERE singleton
  AND project_id = 'young-term-47483330'
  AND branch_id = 'br-crimson-mouse-az7ajkv8'
  AND endpoint_id = 'ep-mute-frost-aztvz394'
  AND database_name = 'neondb';

SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'ccpun_social'
  AND (
    (table_name = 'social_variant_link' AND column_name = 'editorial_version')
    OR (table_name = 'social_publication' AND column_name IN (
      'execution_target', 'approved_revision', 'approved_version',
      'approved_by_actor_ref', 'approved_at', 'approval_request_ref'
    ))
    OR (table_name = 'social_publication_job' AND column_name IN ('version', 'max_attempts', 'execution_target'))
    OR table_name = 'social_mobile_handoff'
  )
ORDER BY table_name, ordinal_position;

SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_schema = 'ccpun_social'
  AND constraint_name IN (
    'social_variant_link_editorial_version_check',
    'social_variant_link_format_check',
    'social_publication_execution_target_check',
    'social_publication_approval_snapshot_check',
    'social_publication_schedule_target_check',
    'social_publication_job_version_check',
    'social_publication_job_max_attempts_check',
    'social_publication_job_execution_target_check',
    'social_publication_job_type_target_check'
  )
ORDER BY constraint_name;

SELECT indexname,indexdef
FROM pg_indexes
WHERE schemaname = 'ccpun_social'
  AND indexname = 'social_publication_approved_snapshot_unique'
  AND indexdef LIKE '%UNIQUE%variant_id, approved_revision, approved_version%';

SELECT
  has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_variant_link', 'SELECT') AS variant_select,
  has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_variant_link', 'INSERT') AS variant_insert,
  has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_variant_media', 'SELECT') AS variant_media_select,
  has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_publication', 'SELECT') AS publication_select,
  has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_publication', 'INSERT') AS publication_insert,
  has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_publication_job', 'SELECT') AS job_select,
  has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_publication_job', 'INSERT') AS job_insert,
  has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_mobile_handoff', 'SELECT') AS handoff_select,
  has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_mobile_handoff', 'INSERT') AS handoff_insert,
  has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_execution_audit', 'INSERT') AS audit_insert,
  NOT has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_execution_audit', 'SELECT') AS audit_select_denied,
  has_column_privilege('ccpun_social_runtime', 'ccpun_social.social_publication', 'scheduled_at', 'UPDATE') AS schedule_amend,
  has_column_privilege('ccpun_social_runtime', 'ccpun_social.social_publication_job', 'execution_target', 'UPDATE') AS job_target_amend;

WITH touched(table_name) AS (VALUES
  ('ccpun_social.social_variant_link'),
  ('ccpun_social.social_variant_media'),
  ('ccpun_social.social_publication'),
  ('ccpun_social.social_publication_job'),
  ('ccpun_social.social_mobile_handoff'),
  ('ccpun_social.social_execution_audit')
)
SELECT
  bool_and(NOT has_table_privilege('ccpun_social_runtime', table_name, 'DELETE')) AS delete_denied,
  bool_and(NOT has_table_privilege('ccpun_social_runtime', table_name, 'TRUNCATE')) AS truncate_denied,
  bool_and(NOT has_table_privilege('ccpun_social_runtime', table_name, 'REFERENCES')) AS references_denied,
  bool_and(NOT has_table_privilege('ccpun_social_runtime', table_name, 'TRIGGER')) AS trigger_denied,
  bool_and(NOT has_table_privilege('ccpun_social_runtime', table_name, 'UPDATE')) AS table_wide_update_denied
FROM touched;

SELECT
  has_schema_privilege('ccpun_social_runtime', 'ccpun_social', 'USAGE') AS schema_usage,
  NOT has_schema_privilege('ccpun_social_runtime', 'ccpun_social', 'CREATE') AS schema_create_denied,
  has_database_privilege('ccpun_social_runtime', current_database(), 'CONNECT') AS database_connect,
  NOT has_database_privilege('ccpun_social_runtime', current_database(), 'CREATE') AS database_create_denied,
  NOT EXISTS (
    SELECT 1 FROM information_schema.sequences
    WHERE sequence_schema='ccpun_social'
      AND (has_sequence_privilege('ccpun_social_runtime', format('%I.%I',sequence_schema,sequence_name), 'USAGE')
        OR has_sequence_privilege('ccpun_social_runtime', format('%I.%I',sequence_schema,sequence_name), 'SELECT')
        OR has_sequence_privilege('ccpun_social_runtime', format('%I.%I',sequence_schema,sequence_name), 'UPDATE'))
  ) AS sequences_denied;

ROLLBACK;
