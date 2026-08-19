CREATE TYPE "public"."submission_notification_purpose" AS ENUM('career', 'contact');--> statement-breakpoint
CREATE TYPE "public"."submission_notification_status" AS ENUM('pending', 'sent', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "submission_notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purpose" "submission_notification_purpose" NOT NULL,
	"career_application_id" uuid,
	"contact_submission_id" uuid,
	"locale" "locale" NOT NULL,
	"status" "submission_notification_status" DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_error_code" varchar(120),
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submission_notification_resource_consistent" CHECK (("submission_notification"."purpose" = 'career' AND "submission_notification"."career_application_id" IS NOT NULL AND "submission_notification"."contact_submission_id" IS NULL) OR ("submission_notification"."purpose" = 'contact' AND "submission_notification"."contact_submission_id" IS NOT NULL AND "submission_notification"."career_application_id" IS NULL)),
	CONSTRAINT "submission_notification_attempt_count_nonnegative" CHECK ("submission_notification"."attempt_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "career_application" ADD COLUMN "idempotency_key_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "contact_submission" ADD COLUMN "idempotency_key_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "submission_notification" ADD CONSTRAINT "submission_notification_career_application_id_career_application_id_fk" FOREIGN KEY ("career_application_id") REFERENCES "public"."career_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_notification" ADD CONSTRAINT "submission_notification_contact_submission_id_contact_submission_id_fk" FOREIGN KEY ("contact_submission_id") REFERENCES "public"."contact_submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "submission_notification_delivery_idx" ON "submission_notification" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_notification_career_unique" ON "submission_notification" USING btree ("career_application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_notification_contact_unique" ON "submission_notification" USING btree ("contact_submission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "career_application_idempotency_key_unique" ON "career_application" USING btree ("idempotency_key_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "contact_submission_idempotency_key_unique" ON "contact_submission" USING btree ("idempotency_key_hash");--> statement-breakpoint
ALTER TABLE "career_application" ADD CONSTRAINT "career_application_salary_upper_bound" CHECK ("career_application"."expected_salary_try" IS NULL OR "career_application"."expected_salary_try" <= 100000000);
--> statement-breakpoint
INSERT INTO "department" ("key", "sort_order", "status") VALUES
  ('sales', 10, 'active'),
  ('finance', 20, 'active'),
  ('accounting', 30, 'active'),
  ('it', 40, 'active'),
  ('import-export', 50, 'active'),
  ('warehouse-shipping', 60, 'active')
ON CONFLICT ("key") DO UPDATE SET
  "sort_order" = EXCLUDED."sort_order",
  "status" = 'active';
--> statement-breakpoint
INSERT INTO "department_locale"
  ("department_id", "locale", "name", "publish_status", "published_at")
SELECT d."id", labels."locale"::"locale", labels."name", 'published'::"publication_status", now()
FROM (VALUES
  ('sales', 'tr', 'Satış Temsilcisi'),
  ('sales', 'en', 'Sales Representative'),
  ('finance', 'tr', 'Finans'),
  ('finance', 'en', 'Finance'),
  ('accounting', 'tr', 'Muhasebe'),
  ('accounting', 'en', 'Accounting'),
  ('it', 'tr', 'Bilgi İşlem'),
  ('it', 'en', 'Information Technology'),
  ('import-export', 'tr', 'İthalat & İhracat'),
  ('import-export', 'en', 'Import & Export'),
  ('warehouse-shipping', 'tr', 'Depo & Sevkiyat'),
  ('warehouse-shipping', 'en', 'Warehouse & Shipping')
) AS labels("key", "locale", "name")
JOIN "department" d ON d."key" = labels."key"
ON CONFLICT ("department_id", "locale") DO UPDATE SET
  "name" = EXCLUDED."name",
  "publish_status" = 'published',
  "published_at" = COALESCE("department_locale"."published_at", EXCLUDED."published_at");
--> statement-breakpoint
INSERT INTO "location" ("key", "sort_order", "status") VALUES
  ('istanbul', 10, 'active'),
  ('ankara', 20, 'active'),
  ('diyarbakir', 30, 'active')
ON CONFLICT ("key") DO UPDATE SET
  "sort_order" = EXCLUDED."sort_order",
  "status" = 'active';
--> statement-breakpoint
INSERT INTO "location_locale"
  ("location_id", "locale", "name", "publish_status", "published_at")
SELECT l."id", labels."locale"::"locale", labels."name", 'published'::"publication_status", now()
FROM (VALUES
  ('istanbul', 'tr', 'İstanbul'),
  ('istanbul', 'en', 'Istanbul'),
  ('ankara', 'tr', 'Ankara'),
  ('ankara', 'en', 'Ankara'),
  ('diyarbakir', 'tr', 'Diyarbakır'),
  ('diyarbakir', 'en', 'Diyarbakır')
) AS labels("key", "locale", "name")
JOIN "location" l ON l."key" = labels."key"
ON CONFLICT ("location_id", "locale") DO UPDATE SET
  "name" = EXCLUDED."name",
  "publish_status" = 'published',
  "published_at" = COALESCE("location_locale"."published_at", EXCLUDED."published_at");
