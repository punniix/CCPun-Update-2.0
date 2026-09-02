SELECT
  EXISTS (
    SELECT 1 FROM ccpun_social.schema_migration
    WHERE version = '20260902_social_marketing_mart_p2_full_backfill_clean'
      AND checksum = 'sha256:1dfbe426656ada42fa59f4b0d0727a39c293534abf964690bbbe0d8c6294727f'
  ) AS migration_ok,
  to_regclass('ccpun_social.social_provider_metric_collection_attempt') IS NOT NULL AS collection_attempt_table_ok,
  to_regclass('ccpun_social.post_metric_collection_latest') IS NOT NULL AS collection_latest_view_ok,
  to_regclass('ccpun_social.post_performance_latest') IS NOT NULL AS performance_latest_view_ok,
  to_regclass('ccpun_social.post_metric_status_latest') IS NOT NULL AS metric_status_latest_view_ok,
  to_regclass('ccpun_social.post_metric_coverage_summary') IS NOT NULL AS coverage_summary_view_ok,
  to_regclass('ccpun_social.post_performance_clean') IS NOT NULL AS clean_performance_view_ok,
  has_table_privilege('ccpun_social_runtime','ccpun_social.social_provider_metric_collection_attempt','SELECT,INSERT') AS runtime_attempt_grants_ok,
  NOT has_table_privilege('ccpun_social_runtime','ccpun_social.social_provider_metric_collection_attempt','UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS runtime_attempt_unsafe_grants_denied,
  has_table_privilege('ccpun_social_runtime','ccpun_social.post_metric_collection_latest','SELECT') AS runtime_collection_latest_read_ok,
  has_table_privilege('ccpun_social_runtime','ccpun_social.post_performance_latest','SELECT') AS runtime_performance_latest_read_ok,
  has_table_privilege('ccpun_social_runtime','ccpun_social.post_metric_status_latest','SELECT') AS runtime_metric_status_latest_read_ok,
  has_table_privilege('ccpun_social_runtime','ccpun_social.post_metric_coverage_summary','SELECT') AS runtime_coverage_read_ok,
  has_table_privilege('ccpun_social_runtime','ccpun_social.post_performance_clean','SELECT') AS runtime_clean_performance_read_ok,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='ccpun_social' AND table_name='post_performance_clean'
      AND column_name='metric_coverage_rate'
  ) AS clean_coverage_column_ok,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='ccpun_social' AND table_name='post_performance_clean'
      AND column_name='data_quality_status'
  ) AS clean_quality_column_ok,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='ccpun_social' AND table_name='post_performance_clean'
      AND column_name='analysis_status'
  ) AS clean_analysis_status_column_ok;
