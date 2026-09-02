SELECT
  EXISTS (
    SELECT 1 FROM ccpun_social.schema_migration
    WHERE version = '20260902_social_marketing_mart_p1_meta_insights'
      AND checksum = 'sha256:7bdc2c2b80b59d7364d92ec88dd66ccd5472390291bf0bc3ba82ec424718f671'
  ) AS migration_ok,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='ccpun_social' AND table_name='social_metric_capability' AND column_name='applies_to_format'
  ) AS capability_scope_column_ok,
  (SELECT count(*) >= 16 FROM ccpun_social.social_metric_capability
   WHERE provider='meta' AND collection_state='requested') AS requested_capabilities_ok,
  EXISTS (SELECT 1 FROM ccpun_social.social_metric_capability WHERE provider='meta' AND platform='facebook' AND metric_key='views' AND native_metric_key='facebook.views' AND collection_state='requested') AS facebook_views_ok,
  EXISTS (SELECT 1 FROM ccpun_social.social_metric_capability WHERE provider='meta' AND platform='facebook' AND metric_key='clicks' AND native_metric_key='facebook.clicks' AND collection_state='requested') AS facebook_clicks_ok,
  EXISTS (SELECT 1 FROM ccpun_social.social_metric_capability WHERE provider='meta' AND platform='instagram' AND metric_key='reach' AND native_metric_key='instagram.reach' AND collection_state='requested') AS instagram_reach_ok,
  EXISTS (SELECT 1 FROM ccpun_social.social_metric_capability WHERE provider='meta' AND platform='instagram' AND metric_key='saves' AND native_metric_key='instagram.saves' AND collection_state='requested') AS instagram_saves_ok,
  EXISTS (SELECT 1 FROM ccpun_social.social_metric_capability WHERE provider='meta' AND platform='instagram' AND metric_key='shares' AND native_metric_key='instagram.shares' AND collection_state='requested') AS instagram_shares_ok,
  EXISTS (SELECT 1 FROM ccpun_social.social_metric_capability WHERE provider='meta' AND platform='instagram' AND metric_key='reel_total_watch_time_ms' AND applies_to_format='video') AS reel_watch_scope_ok,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='ccpun_social' AND table_name='post_performance_snapshot' AND column_name='views') AS performance_views_column_ok,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='ccpun_social' AND table_name='post_performance_snapshot' AND column_name='clicks') AS performance_clicks_column_ok,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='ccpun_social' AND table_name='post_performance_snapshot' AND column_name='total_interactions') AS performance_interactions_column_ok,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='ccpun_social' AND table_name='post_performance_snapshot' AND column_name='reel_average_watch_time_ms') AS performance_reel_watch_column_ok,
  has_table_privilege('ccpun_social_runtime','ccpun_social.post_performance_snapshot','SELECT') AS runtime_performance_read_ok,
  NOT has_table_privilege('ccpun_social_runtime','ccpun_social.social_metric_capability','INSERT,UPDATE,DELETE') AS runtime_capability_write_denied;
