-- AlterEnum: Remove 'slide' value from ReminderStatus
-- First, update any existing reminders with status 'slide' to 'sent'
UPDATE "reminders" SET "status" = 'sent' WHERE "status" = 'slide';

-- Drop the default constraint first
ALTER TABLE "reminders" ALTER COLUMN "status" DROP DEFAULT;

-- Recreate the enum without 'slide'
ALTER TYPE "ReminderStatus" RENAME TO "ReminderStatus_old";
CREATE TYPE "ReminderStatus" AS ENUM ('pending', 'sent', 'cancelled');
ALTER TABLE "reminders" ALTER COLUMN "status" TYPE "ReminderStatus" USING "status"::text::"ReminderStatus";
DROP TYPE "ReminderStatus_old";

-- Re-add the default
ALTER TABLE "reminders" ALTER COLUMN "status" SET DEFAULT 'pending'::"ReminderStatus";

-- Rename slide_decks table to memory_decks
ALTER TABLE "slide_decks" RENAME TO "memory_decks";

-- Add new columns to memory_decks
ALTER TABLE "memory_decks" ADD COLUMN "is_archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "memory_decks" ADD COLUMN "auto_created" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "memory_decks" ADD COLUMN "week_start_date" TIMESTAMP(3);

-- Rename slides table to memory_deck_items
ALTER TABLE "slides" RENAME TO "memory_deck_items";

-- Rename slide_deck_id column in memory_deck_items
ALTER TABLE "memory_deck_items" RENAME COLUMN "slide_deck_id" TO "memory_deck_id";

-- Drop reminder_id column (first drop the unique constraint and then the column)
ALTER TABLE "memory_deck_items" DROP CONSTRAINT IF EXISTS "slides_reminder_id_key";
ALTER TABLE "memory_deck_items" DROP COLUMN IF EXISTS "reminder_id";

-- Update index names
DROP INDEX IF EXISTS "slide_decks_user_id_created_at_idx";
CREATE INDEX "memory_decks_user_id_created_at_idx" ON "memory_decks"("user_id", "created_at" DESC);
CREATE INDEX "memory_decks_user_id_is_archived_idx" ON "memory_decks"("user_id", "is_archived");

DROP INDEX IF EXISTS "slides_slide_deck_id_sort_order_idx";
CREATE INDEX "memory_deck_items_memory_deck_id_sort_order_idx" ON "memory_deck_items"("memory_deck_id", "sort_order");

DROP INDEX IF EXISTS "slides_memory_id_idx";
CREATE INDEX "memory_deck_items_memory_id_idx" ON "memory_deck_items"("memory_id");

-- Create concept_mappings table
CREATE TABLE "concept_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "term" VARCHAR(100) NOT NULL,
    "normalized_term" VARCHAR(100) NOT NULL,
    "domains" JSONB NOT NULL,
    "related_keywords" JSONB NOT NULL,
    "source" VARCHAR(20) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concept_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "concept_mappings_term_key" ON "concept_mappings"("term");
CREATE INDEX "concept_mappings_normalized_term_idx" ON "concept_mappings"("normalized_term");
CREATE INDEX "concept_mappings_source_idx" ON "concept_mappings"("source");
