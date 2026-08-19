CREATE TABLE "contact_submission_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_submission_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_submission_note_body_not_blank" CHECK (length(btrim("contact_submission_note"."body")) > 0)
);
--> statement-breakpoint
ALTER TABLE "page_locale" ADD COLUMN "og_title" varchar(255);--> statement-breakpoint
ALTER TABLE "page_locale" ADD COLUMN "og_description" text;--> statement-breakpoint
ALTER TABLE "page_locale" ADD COLUMN "og_media_id" uuid;--> statement-breakpoint
ALTER TABLE "page_locale" ADD COLUMN "allow_indexing" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_submission_note" ADD CONSTRAINT "contact_submission_note_contact_submission_id_contact_submission_id_fk" FOREIGN KEY ("contact_submission_id") REFERENCES "public"."contact_submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_submission_note" ADD CONSTRAINT "contact_submission_note_created_by_admin_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_submission_note_submission_idx" ON "contact_submission_note" USING btree ("contact_submission_id","created_at");--> statement-breakpoint
ALTER TABLE "page_locale" ADD CONSTRAINT "page_locale_og_media_id_media_id_fk" FOREIGN KEY ("og_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;