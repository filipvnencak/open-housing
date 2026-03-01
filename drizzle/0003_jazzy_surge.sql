CREATE TYPE "public"."voting_method" AS ENUM('per_share', 'per_flat', 'per_area');--> statement-breakpoint
ALTER TABLE "building" ADD COLUMN "voting_method" "voting_method" DEFAULT 'per_share' NOT NULL;--> statement-breakpoint
ALTER TABLE "flats" ADD COLUMN "area" integer;