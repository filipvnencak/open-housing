CREATE TYPE "public"."quorum_type" AS ENUM('simple_present', 'simple_all', 'two_thirds_all');--> statement-breakpoint
CREATE TYPE "public"."voting_initiated_by" AS ENUM('board', 'owners_quarter');--> statement-breakpoint
CREATE TYPE "public"."voting_type" AS ENUM('written', 'meeting');--> statement-breakpoint
DELETE FROM "votes";--> statement-breakpoint
DELETE FROM "mandates";--> statement-breakpoint
ALTER TABLE "mandates" ADD COLUMN "from_flat_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "mandates" ADD COLUMN "paper_document_confirmed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mandates" ADD COLUMN "verified_by_admin_id" uuid;--> statement-breakpoint
ALTER TABLE "mandates" ADD COLUMN "verification_date" timestamp;--> statement-breakpoint
ALTER TABLE "mandates" ADD COLUMN "verification_note" text;--> statement-breakpoint
ALTER TABLE "votes" ADD COLUMN "flat_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "votings" ADD COLUMN "voting_type" "voting_type" DEFAULT 'written' NOT NULL;--> statement-breakpoint
ALTER TABLE "votings" ADD COLUMN "initiated_by" "voting_initiated_by" DEFAULT 'board' NOT NULL;--> statement-breakpoint
ALTER TABLE "votings" ADD COLUMN "quorum_type" "quorum_type" DEFAULT 'simple_all' NOT NULL;--> statement-breakpoint
ALTER TABLE "mandates" ADD CONSTRAINT "mandates_from_flat_id_flats_id_fk" FOREIGN KEY ("from_flat_id") REFERENCES "public"."flats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mandates" ADD CONSTRAINT "mandates_verified_by_admin_id_users_id_fk" FOREIGN KEY ("verified_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_flat_id_flats_id_fk" FOREIGN KEY ("flat_id") REFERENCES "public"."flats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "mandates_voting_flat_idx" ON "mandates" USING btree ("voting_id","from_flat_id");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_voting_flat_idx" ON "votes" USING btree ("voting_id","flat_id");