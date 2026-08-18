CREATE TYPE "public"."permission_scope" AS ENUM('all', 'content', 'public_locale', 'recruitment', 'retention');--> statement-breakpoint
CREATE TABLE "malware_scan_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_event_id" varchar(160) NOT NULL,
	"media_id" uuid NOT NULL,
	"result" varchar(80) NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_bucket" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route" varchar(120) NOT NULL,
	"identifier_hash" varchar(64) NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"request_count" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rate_limit_bucket_count_positive" CHECK ("rate_limit_bucket"."request_count" > 0)
);
--> statement-breakpoint
ALTER TABLE "career_application" DROP CONSTRAINT "career_application_salary_nonnegative";--> statement-breakpoint
ALTER TABLE "career_application" DROP CONSTRAINT "career_application_cv_file_id_media_id_fk";
--> statement-breakpoint
ALTER TABLE "career_application" ALTER COLUMN "first_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "career_application" ALTER COLUMN "last_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "career_application" ALTER COLUMN "phone_normalized" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "career_application" ALTER COLUMN "email_normalized" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "career_application" ALTER COLUMN "expected_salary_try" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "career_application" ALTER COLUMN "available_from" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "career_application" ALTER COLUMN "about_text" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "career_application" ALTER COLUMN "cv_file_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_submission" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_submission" ALTER COLUMN "email_normalized" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_submission" ALTER COLUMN "subject" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_submission" ALTER COLUMN "message" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_user" ADD COLUMN "auth0_subject" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "career_application" ADD COLUMN "retention_hold_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "career_application" ADD COLUMN "anonymized_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contact_submission" ADD COLUMN "retention_hold_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contact_submission" ADD COLUMN "anonymized_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "scan_attempt_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "scan_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "scan_last_result" varchar(80);--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "scan_last_error_code" varchar(120);--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "scan_next_retry_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "role_permission" ADD COLUMN "scope" "permission_scope" DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE "malware_scan_event" ADD CONSTRAINT "malware_scan_event_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "malware_scan_event_provider_event_unique" ON "malware_scan_event" USING btree ("provider_event_id");--> statement-breakpoint
CREATE INDEX "malware_scan_event_media_idx" ON "malware_scan_event" USING btree ("media_id","processed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limit_bucket_window_unique" ON "rate_limit_bucket" USING btree ("route","identifier_hash","window_started_at");--> statement-breakpoint
CREATE INDEX "rate_limit_bucket_expiry_idx" ON "rate_limit_bucket" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "career_application" ADD CONSTRAINT "career_application_cv_file_id_media_id_fk" FOREIGN KEY ("cv_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_user_auth0_subject_unique" ON "admin_user" USING btree ("auth0_subject");--> statement-breakpoint
CREATE UNIQUE INDEX "career_application_cv_file_unique" ON "career_application" USING btree ("cv_file_id");--> statement-breakpoint
ALTER TABLE "career_application" ADD CONSTRAINT "career_application_required_unless_anonymized" CHECK ("career_application"."anonymized_at" IS NOT NULL OR ("career_application"."first_name" IS NOT NULL AND "career_application"."last_name" IS NOT NULL AND "career_application"."phone_normalized" IS NOT NULL AND "career_application"."email_normalized" IS NOT NULL AND "career_application"."expected_salary_try" IS NOT NULL AND "career_application"."available_from" IS NOT NULL AND "career_application"."about_text" IS NOT NULL AND "career_application"."cv_file_id" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "career_application" ADD CONSTRAINT "career_application_salary_nonnegative" CHECK ("career_application"."expected_salary_try" IS NULL OR "career_application"."expected_salary_try" >= 0);--> statement-breakpoint
ALTER TABLE "contact_submission" ADD CONSTRAINT "contact_submission_required_unless_anonymized" CHECK ("contact_submission"."anonymized_at" IS NOT NULL OR ("contact_submission"."name" IS NOT NULL AND "contact_submission"."email_normalized" IS NOT NULL AND "contact_submission"."subject" IS NOT NULL AND "contact_submission"."message" IS NOT NULL));
--> statement-breakpoint
INSERT INTO "role" ("key", "name") VALUES
  ('super_admin', 'Super Admin'),
  ('content_editor', 'İçerik Editörü'),
  ('hr', 'İnsan Kaynakları'),
  ('contact_manager', 'İletişim Yöneticisi'),
  ('viewer', 'Görüntüleyici')
ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint
INSERT INTO "permission" ("key", "resource", "action")
SELECT permission_key, split_part(permission_key, ':', 1), split_part(permission_key, ':', 2)
FROM unnest(ARRAY[
  'Dashboard:view',
  'Pages:view', 'Pages:create', 'Pages:edit', 'Pages:preview', 'Pages:publish', 'Pages:schedule', 'Pages:archive', 'Pages:rollback',
  'Brands:view', 'Brands:create', 'Brands:edit', 'Brands:publish',
  'ProductGroups:view', 'ProductGroups:create', 'ProductGroups:edit', 'ProductGroups:publish',
  'Locations:view', 'Locations:create', 'Locations:edit', 'Locations:publish',
  'Departments:view', 'Departments:create', 'Departments:edit',
  'Media:view-public', 'Media:upload-public', 'Media:delete-public',
  'CareerContent:view', 'CareerContent:edit', 'CareerContent:publish',
  'Applications:view', 'Applications:status', 'Applications:notes', 'Applications:cv-download', 'Applications:delete', 'Applications:anonymize',
  'Contact:view', 'Contact:update-status', 'Contact:internal-note', 'Contact:delete',
  'LegalPages:view', 'LegalPages:edit', 'LegalPages:publish',
  'SEO:view', 'SEO:edit', 'SEO:publish',
  'SiteSettings:view', 'SiteSettings:edit-general',
  'DealerPortal:update',
  'Users:view', 'Users:create', 'Users:edit', 'Users:disable',
  'Roles:assign',
  'Audit:view-global', 'Audit:view-career-scope', 'Audit:view-contact-scope', 'Audit:export'
]::text[]) AS permission_key
ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint
WITH grants AS (
  SELECT 'super_admin'::text AS role_key, p."key" AS permission_key, 'all'::permission_scope AS scope
  FROM "permission" p
  UNION ALL
  SELECT 'content_editor', p."key",
    CASE
      WHEN p."resource" = 'Departments' AND p."action" IN ('create', 'edit') THEN 'public_locale'::permission_scope
      WHEN p."key" = 'SiteSettings:edit-general' THEN 'content'::permission_scope
      ELSE 'all'::permission_scope
    END
  FROM "permission" p
  WHERE p."resource" IN ('Dashboard', 'Pages', 'Brands', 'ProductGroups', 'Locations', 'Departments', 'Media', 'CareerContent', 'LegalPages', 'SEO', 'SiteSettings')
  UNION ALL
  SELECT 'hr', p."key",
    CASE
      WHEN p."resource" = 'Departments' AND p."action" IN ('create', 'edit') THEN 'recruitment'::permission_scope
      WHEN p."resource" = 'Media' THEN 'recruitment'::permission_scope
      WHEN p."resource" = 'Applications' AND p."action" IN ('delete', 'anonymize') THEN 'retention'::permission_scope
      ELSE 'all'::permission_scope
    END
  FROM "permission" p
  WHERE p."key" IN (
    'Dashboard:view', 'Pages:view', 'Brands:view', 'ProductGroups:view', 'Locations:view',
    'Departments:view', 'Departments:create', 'Departments:edit',
    'Media:view-public', 'Media:upload-public',
    'CareerContent:view', 'CareerContent:edit', 'CareerContent:publish',
    'Applications:view', 'Applications:status', 'Applications:notes', 'Applications:cv-download', 'Applications:delete', 'Applications:anonymize',
    'LegalPages:view', 'SEO:view', 'SiteSettings:view', 'Audit:view-career-scope'
  )
  UNION ALL
  SELECT 'contact_manager', p."key",
    CASE WHEN p."key" = 'Contact:delete' THEN 'retention'::permission_scope ELSE 'all'::permission_scope END
  FROM "permission" p
  WHERE p."key" IN (
    'Dashboard:view', 'Pages:view', 'Contact:view', 'Contact:update-status', 'Contact:internal-note', 'Contact:delete',
    'LegalPages:view', 'SiteSettings:view', 'Audit:view-contact-scope'
  )
  UNION ALL
  SELECT 'viewer', p."key", 'all'::permission_scope
  FROM "permission" p
  WHERE p."key" IN (
    'Dashboard:view', 'Pages:view', 'Pages:preview', 'Brands:view', 'ProductGroups:view', 'Locations:view',
    'Departments:view', 'Media:view-public', 'CareerContent:view', 'LegalPages:view', 'SEO:view', 'SiteSettings:view'
  )
)
INSERT INTO "role_permission" ("role_id", "permission_id", "scope")
SELECT r."id", p."id", g.scope
FROM grants g
JOIN "role" r ON r."key" = g.role_key
JOIN "permission" p ON p."key" = g.permission_key
ON CONFLICT ("role_id", "permission_id") DO UPDATE SET "scope" = EXCLUDED."scope";
--> statement-breakpoint
CREATE FUNCTION prevent_audit_event_mutation() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_event is append-only';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER audit_event_append_only
BEFORE UPDATE OR DELETE ON "audit_event"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_event_mutation();
