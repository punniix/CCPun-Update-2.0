BEGIN READ ONLY;

SELECT current_database() AS database_name, current_user AS role_name;

SELECT version, checksum, applied_at
FROM ccpun_social.schema_migration
WHERE version = '20260901_website_42_social_comment_execution_v1'
  AND checksum = 'sha256:c9a5512469d8894ccbdebf5c051d7471aef1f9d59973b6a71f5d0f2b7618155d';

SELECT project_id, branch_id, endpoint_id, database_name
FROM ccpun_social.system_identity
WHERE singleton
  AND project_id = 'young-term-47483330'
  AND branch_id = 'br-crimson-mouse-az7ajkv8'
  AND endpoint_id = 'ep-mute-frost-aztvz394'
  AND database_name = 'neondb';

SELECT
  has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_comment_item', 'SELECT') AS comment_select,
  has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_comment_item', 'INSERT') AS comment_insert,
  has_column_privilege('ccpun_social_runtime', 'ccpun_social.social_comment_item', 'status', 'UPDATE') AS comment_status_update,
  has_column_privilege('ccpun_social_runtime', 'ccpun_social.social_comment_item', 'platform_comment_id', 'UPDATE') AS comment_platform_id_update,
  has_column_privilege('ccpun_social_runtime', 'ccpun_social.social_comment_item', 'updated_at', 'UPDATE') AS comment_updated_at_update,
  NOT has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_comment_item', 'DELETE') AS comment_delete_denied,
  NOT has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_comment_item', 'TRUNCATE') AS comment_truncate_denied,
  NOT has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_comment_item', 'REFERENCES') AS comment_references_denied,
  NOT has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_comment_item', 'TRIGGER') AS comment_trigger_denied,
  NOT has_table_privilege('ccpun_social_runtime', 'ccpun_social.social_comment_item', 'UPDATE') AS comment_table_wide_update_denied;

ROLLBACK;
