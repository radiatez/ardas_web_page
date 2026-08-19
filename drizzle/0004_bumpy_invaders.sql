CREATE TABLE "content_draft" (
	"entity_type" varchar(80) NOT NULL,
	"entity_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"snapshot" jsonb NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_draft_primary_key" PRIMARY KEY("entity_type","entity_id","locale")
);
--> statement-breakpoint
ALTER TABLE "content_draft" ADD CONSTRAINT "content_draft_updated_by_admin_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_draft_updated_idx" ON "content_draft" USING btree ("updated_at");