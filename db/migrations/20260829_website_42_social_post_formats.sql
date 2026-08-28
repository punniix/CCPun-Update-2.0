BEGIN;

DO $migration_guard$
DECLARE
  current_checksum text;
  foundation_current boolean;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('ccpun_social:20260829_website_42_social_post_formats'));

  SELECT EXISTS (
    SELECT 1
    FROM ccpun_social.schema_migration
    WHERE version = '20260828_website_42_social_foundation_v2'
      AND checksum = 'sha256:b6ad0b823775df1dcfc06e0da896dfcc477cfbeae897b70e228c18a051712acb'
  ) INTO foundation_current;

  IF NOT foundation_current THEN
    RAISE EXCEPTION 'CCPUN social foundation migration is required first';
  END IF;

  SELECT checksum INTO current_checksum
  FROM ccpun_social.schema_migration
  WHERE version = '20260829_website_42_social_post_formats';

  IF current_checksum IS NOT NULL AND current_checksum <> 'sha256:64d8471247fa28a08fcb99cda5b4df87e73f7ed1dc497250da26d01119ade977' THEN
    RAISE EXCEPTION 'CCPUN social post-format migration checksum mismatch';
  END IF;
END
$migration_guard$;

-- checksum-source-begin
ALTER TABLE ccpun_social.social_variant_link
  DROP CONSTRAINT social_variant_link_format_check;

ALTER TABLE ccpun_social.social_variant_link
  ADD CONSTRAINT social_variant_link_format_check
  CHECK (format IN ('text-post', 'image-post', 'album', 'carousel', 'comment-series', 'reel', 'video', 'short', 'photo-post', 'live'));
-- checksum-source-end

INSERT INTO ccpun_social.schema_migration (version, checksum)
VALUES (
  '20260829_website_42_social_post_formats',
  'sha256:64d8471247fa28a08fcb99cda5b4df87e73f7ed1dc497250da26d01119ade977'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
