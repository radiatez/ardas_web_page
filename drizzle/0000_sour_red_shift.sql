CREATE TYPE "public"."admin_user_status" AS ENUM('invited', 'active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('new', 'in_review', 'interview', 'rejected', 'hired', 'archived');--> statement-breakpoint
CREATE TYPE "public"."contact_status" AS ENUM('new', 'read', 'replied', 'archived');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('tr', 'en');--> statement-breakpoint
CREATE TYPE "public"."malware_scan_status" AS ENUM('pending', 'clean', 'infected', 'error');--> statement-breakpoint
CREATE TYPE "public"."publication_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."record_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."route_key" AS ENUM('home', 'corporate', 'brands', 'product-groups', 'locations', 'careers', 'career-apply', 'contact', 'privacy', 'cookies', 'data-protection');--> statement-breakpoint
CREATE TYPE "public"."site_setting_key" AS ENUM('display_name', 'company_stats', 'contact_footer', 'social_links', 'default_seo', 'dealer_portal_url', 'candidate_retention_days', 'contact_retention_days', 'audit_retention_days', 'contact_notification_recipient', 'hr_notification_recipient', 'content_owner_metadata');--> statement-breakpoint
CREATE TYPE "public"."storage_class" AS ENUM('public', 'protected', 'quarantine');--> statement-breakpoint
CREATE TABLE "admin_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"display_name" varchar(160) NOT NULL,
	"status" "admin_user_status" DEFAULT 'invited' NOT NULL,
	"mfa_enrolled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "application_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"from_status" "application_status",
	"to_status" "application_status" NOT NULL,
	"changed_by" uuid,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"event_type" varchar(160) NOT NULL,
	"resource_type" varchar(120) NOT NULL,
	"resource_id" uuid,
	"metadata_redacted" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_locale" (
	"brand_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"short_description" text,
	"publish_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_publish_at" timestamp with time zone,
	"scheduled_archive_at" timestamp with time zone,
	CONSTRAINT "brand_locale_primary_key" PRIMARY KEY("brand_id","locale")
);
--> statement-breakpoint
CREATE TABLE "brand" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo_media_id" uuid,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "record_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_application_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_application" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_posting_id" uuid,
	"first_name" varchar(120) NOT NULL,
	"last_name" varchar(120) NOT NULL,
	"phone_normalized" varchar(32) NOT NULL,
	"email_normalized" varchar(320) NOT NULL,
	"gender" varchar(80),
	"birth_date" date,
	"marital_status" varchar(80),
	"military_status" varchar(80),
	"deferment_date" date,
	"department_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"knows_company" boolean NOT NULL,
	"knows_company_source" text,
	"expected_salary_try" numeric(12, 2) NOT NULL,
	"available_from" date NOT NULL,
	"about_text" text NOT NULL,
	"cv_file_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"privacy_notice_version" varchar(120) NOT NULL,
	"privacy_notice_shown_at" timestamp with time zone NOT NULL,
	"privacy_acknowledged_at" timestamp with time zone,
	"status" "application_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retention_due_at" timestamp with time zone NOT NULL,
	CONSTRAINT "career_application_company_source_consistent" CHECK (("career_application"."knows_company" AND "career_application"."knows_company_source" IS NOT NULL) OR (NOT "career_application"."knows_company" AND "career_application"."knows_company_source" IS NULL)),
	CONSTRAINT "career_application_salary_nonnegative" CHECK ("career_application"."expected_salary_try" >= 0)
);
--> statement-breakpoint
CREATE TABLE "contact_submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(240) NOT NULL,
	"company" varchar(255),
	"email_normalized" varchar(320) NOT NULL,
	"phone_normalized" varchar(32),
	"subject" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"locale" "locale" NOT NULL,
	"privacy_notice_version" varchar(120) NOT NULL,
	"privacy_notice_shown_at" timestamp with time zone NOT NULL,
	"privacy_acknowledged_at" timestamp with time zone,
	"status" "contact_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retention_due_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_revision" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(80) NOT NULL,
	"entity_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"revision_no" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_revision_number_positive" CHECK ("content_revision"."revision_no" > 0)
);
--> statement-breakpoint
CREATE TABLE "department_locale" (
	"department_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"publish_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_publish_at" timestamp with time zone,
	"scheduled_archive_at" timestamp with time zone,
	CONSTRAINT "department_locale_primary_key" PRIMARY KEY("department_id","locale")
);
--> statement-breakpoint
CREATE TABLE "department" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(120) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "record_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_posting_locale" (
	"job_posting_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"summary" text,
	"description" text NOT NULL,
	"publish_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_publish_at" timestamp with time zone,
	"scheduled_archive_at" timestamp with time zone,
	CONSTRAINT "job_posting_locale_primary_key" PRIMARY KEY("job_posting_id","locale")
);
--> statement-breakpoint
CREATE TABLE "job_posting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"location_id" uuid,
	"status" "record_status" DEFAULT 'inactive' NOT NULL,
	"published_at" timestamp with time zone,
	"closing_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "location_locale" (
	"location_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"working_hours_text" text,
	"publish_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_publish_at" timestamp with time zone,
	"scheduled_archive_at" timestamp with time zone,
	CONSTRAINT "location_locale_primary_key" PRIMARY KEY("location_id","locale")
);
--> statement-breakpoint
CREATE TABLE "location" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(120) NOT NULL,
	"address_data" jsonb,
	"contact_data" jsonb,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"media_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "record_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_class" "storage_class" NOT NULL,
	"storage_key" text NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"mime_type" varchar(160) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"width" integer,
	"height" integer,
	"focal_x" real,
	"focal_y" real,
	"scan_status" "malware_scan_status",
	"scan_completed_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_size_positive" CHECK ("media"."size_bytes" > 0),
	CONSTRAINT "media_protected_requires_clean_scan" CHECK ("media"."storage_class" <> 'protected' OR "media"."scan_status" = 'clean'),
	CONSTRAINT "media_focal_x_range" CHECK ("media"."focal_x" IS NULL OR ("media"."focal_x" >= 0 AND "media"."focal_x" <= 1)),
	CONSTRAINT "media_focal_y_range" CHECK ("media"."focal_y" IS NULL OR ("media"."focal_y" >= 0 AND "media"."focal_y" <= 1))
);
--> statement-breakpoint
CREATE TABLE "media_locale" (
	"media_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"alt_text" text,
	"caption" text,
	"publish_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_publish_at" timestamp with time zone,
	"scheduled_archive_at" timestamp with time zone,
	CONSTRAINT "media_locale_primary_key" PRIMARY KEY("media_id","locale")
);
--> statement-breakpoint
CREATE TABLE "page_locale" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"seo_title" varchar(255),
	"seo_description" text,
	"publish_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_publish_at" timestamp with time zone,
	"scheduled_archive_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "page" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_key" "route_key" NOT NULL,
	"template_key" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(120) NOT NULL,
	"resource" varchar(80) NOT NULL,
	"action" varchar(80) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_group_locale" (
	"product_group_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"short_description" text,
	"publish_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_publish_at" timestamp with time zone,
	"scheduled_archive_at" timestamp with time zone,
	CONSTRAINT "product_group_locale_primary_key" PRIMARY KEY("product_group_id","locale")
);
--> statement-breakpoint
CREATE TABLE "product_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(120) NOT NULL,
	"image_media_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "record_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permission" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	CONSTRAINT "role_permission_primary_key" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "role" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(80) NOT NULL,
	"name" varchar(160) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_setting" (
	"key" "site_setting_key" PRIMARY KEY NOT NULL,
	"typed_value" jsonb NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slug_redirect" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locale" "locale" NOT NULL,
	"entity_type" varchar(80) NOT NULL,
	"entity_id" uuid NOT NULL,
	"old_path" varchar(512) NOT NULL,
	"new_path" varchar(512) NOT NULL,
	"http_status" integer DEFAULT 301 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disabled_at" timestamp with time zone,
	CONSTRAINT "slug_redirect_http_status_301" CHECK ("slug_redirect"."http_status" = 301),
	CONSTRAINT "slug_redirect_paths_differ" CHECK ("slug_redirect"."old_path" <> "slug_redirect"."new_path")
);
--> statement-breakpoint
CREATE TABLE "user_role" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	CONSTRAINT "user_role_primary_key" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_career_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."career_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_changed_by_admin_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."admin_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actor_user_id_admin_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."admin_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_locale" ADD CONSTRAINT "brand_locale_brand_id_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand" ADD CONSTRAINT "brand_logo_media_id_media_id_fk" FOREIGN KEY ("logo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_application_note" ADD CONSTRAINT "career_application_note_application_id_career_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."career_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_application_note" ADD CONSTRAINT "career_application_note_created_by_admin_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_application" ADD CONSTRAINT "career_application_job_posting_id_job_posting_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_posting"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_application" ADD CONSTRAINT "career_application_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_application" ADD CONSTRAINT "career_application_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_application" ADD CONSTRAINT "career_application_cv_file_id_media_id_fk" FOREIGN KEY ("cv_file_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_revision" ADD CONSTRAINT "content_revision_created_by_admin_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_locale" ADD CONSTRAINT "department_locale_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_posting_locale" ADD CONSTRAINT "job_posting_locale_job_posting_id_job_posting_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_posting"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_posting" ADD CONSTRAINT "job_posting_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_posting" ADD CONSTRAINT "job_posting_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_locale" ADD CONSTRAINT "location_locale_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_created_by_admin_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_locale" ADD CONSTRAINT "media_locale_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_locale" ADD CONSTRAINT "page_locale_page_id_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_group_locale" ADD CONSTRAINT "product_group_locale_product_group_id_product_group_id_fk" FOREIGN KEY ("product_group_id") REFERENCES "public"."product_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_group" ADD CONSTRAINT "product_group_image_media_id_media_id_fk" FOREIGN KEY ("image_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_setting" ADD CONSTRAINT "site_setting_updated_by_admin_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_admin_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_user_email_unique" ON "admin_user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "application_status_history_application_idx" ON "application_status_history" USING btree ("application_id","changed_at");--> statement-breakpoint
CREATE INDEX "audit_event_resource_idx" ON "audit_event" USING btree ("resource_type","resource_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_event_actor_idx" ON "audit_event" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "brand_sort_idx" ON "brand" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "career_application_note_application_idx" ON "career_application_note" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "career_application_status_created_idx" ON "career_application" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "career_application_retention_idx" ON "career_application" USING btree ("retention_due_at");--> statement-breakpoint
CREATE INDEX "contact_submission_status_created_idx" ON "contact_submission" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "contact_submission_retention_idx" ON "contact_submission" USING btree ("retention_due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "content_revision_entity_locale_number_unique" ON "content_revision" USING btree ("entity_type","entity_id","locale","revision_no");--> statement-breakpoint
CREATE UNIQUE INDEX "department_key_unique" ON "department" USING btree ("key");--> statement-breakpoint
CREATE INDEX "department_sort_idx" ON "department" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "job_posting_locale_slug_unique" ON "job_posting_locale" USING btree ("locale","slug");--> statement-breakpoint
CREATE INDEX "job_posting_department_location_idx" ON "job_posting" USING btree ("department_id","location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "location_key_unique" ON "location" USING btree ("key");--> statement-breakpoint
CREATE INDEX "location_sort_idx" ON "location" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "media_storage_key_unique" ON "media" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "media_storage_scan_idx" ON "media" USING btree ("storage_class","scan_status");--> statement-breakpoint
CREATE UNIQUE INDEX "page_locale_page_locale_unique" ON "page_locale" USING btree ("page_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "page_locale_locale_slug_unique" ON "page_locale" USING btree ("locale","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "page_route_key_unique" ON "page" USING btree ("route_key");--> statement-breakpoint
CREATE UNIQUE INDEX "permission_key_unique" ON "permission" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "permission_resource_action_unique" ON "permission" USING btree ("resource","action");--> statement-breakpoint
CREATE UNIQUE INDEX "product_group_locale_slug_unique" ON "product_group_locale" USING btree ("locale","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "product_group_key_unique" ON "product_group" USING btree ("key");--> statement-breakpoint
CREATE INDEX "product_group_sort_idx" ON "product_group" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "role_key_unique" ON "role" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "slug_redirect_old_path_unique" ON "slug_redirect" USING btree ("old_path");--> statement-breakpoint
CREATE INDEX "slug_redirect_entity_idx" ON "slug_redirect" USING btree ("entity_type","entity_id","locale");