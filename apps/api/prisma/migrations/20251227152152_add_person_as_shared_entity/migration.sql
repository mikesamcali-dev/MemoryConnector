-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('free', 'premium');

-- CreateEnum
CREATE TYPE "MemoryState" AS ENUM ('SAVED', 'DRAFT', 'DELETED');

-- CreateEnum
CREATE TYPE "storagestrategy" AS ENUM ('generic', 'structured');

-- CreateEnum
CREATE TYPE "EnrichmentStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'queued_budget');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('pending', 'sent', 'cancelled');

-- CreateEnum
CREATE TYPE "linktype" AS ENUM ('locatedAt', 'summaryOf', 'hasMedia', 'related', 'mentions');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "roles" TEXT[] DEFAULT ARRAY['user']::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_usage" (
    "user_id" UUID NOT NULL,
    "memories_today" INTEGER NOT NULL DEFAULT 0,
    "memories_this_month" INTEGER NOT NULL DEFAULT 0,
    "images_this_month" INTEGER NOT NULL DEFAULT 0,
    "voice_this_month" INTEGER NOT NULL DEFAULT 0,
    "searches_today" INTEGER NOT NULL DEFAULT 0,
    "storage_bytes" BIGINT NOT NULL DEFAULT 0,
    "last_daily_reset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_monthly_reset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_usage_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "tier_limits" (
    "tier" TEXT NOT NULL,
    "memories_per_day" INTEGER NOT NULL,
    "memories_per_month" INTEGER NOT NULL,
    "images_per_month" INTEGER NOT NULL,
    "voice_per_month" INTEGER NOT NULL,
    "searches_per_day" INTEGER NOT NULL,
    "storage_bytes" BIGINT NOT NULL,
    "api_rate_per_min" INTEGER NOT NULL,

    CONSTRAINT "tier_limits_pkey" PRIMARY KEY ("tier")
);

-- CreateTable
CREATE TABLE "memory_types" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT DEFAULT '📝',
    "color" TEXT DEFAULT '#6B7280',
    "storage_strategy" "storagestrategy" NOT NULL DEFAULT 'generic',
    "table_name" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memories" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(500),
    "body" TEXT,
    "occurred_at" TIMESTAMP(3),
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "data" JSONB,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "image_url" TEXT,
    "state" "MemoryState" NOT NULL DEFAULT 'SAVED',
    "content_hash" VARCHAR(32),
    "enrichment_status" "EnrichmentStatus" NOT NULL DEFAULT 'pending',
    "enrichment_queued_at" TIMESTAMP(3),
    "location_id" UUID,
    "person_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_type_assignments" (
    "memory_id" UUID NOT NULL,
    "memory_type_id" UUID NOT NULL,
    "confidence" DOUBLE PRECISION DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_type_assignments_pkey" PRIMARY KEY ("memory_id","memory_type_id")
);

-- CreateTable
CREATE TABLE "events" (
    "memory_id" UUID NOT NULL,
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "timezone" VARCHAR(50),
    "recurrence_rule" TEXT,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_enriched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("memory_id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "place_type" VARCHAR(50),
    "last_enriched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" UUID NOT NULL,
    "display_name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "bio" TEXT,
    "last_enriched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "words" (
    "memory_id" UUID NOT NULL,
    "word" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "phonetic" VARCHAR(100),
    "part_of_speech" VARCHAR(50),
    "etymology" TEXT,
    "examples" JSONB,
    "synonyms" JSONB,
    "antonyms" JSONB,
    "difficulty" VARCHAR(20),
    "last_enriched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "words_pkey" PRIMARY KEY ("memory_id")
);

-- CreateTable
CREATE TABLE "memory_links" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "target_id" UUID NOT NULL,
    "link_type" "linktype" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embeddings" (
    "id" UUID NOT NULL,
    "memory_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "model_version" TEXT NOT NULL DEFAULT 'text-embedding-ada-002',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "memory_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "status" "ReminderStatus" NOT NULL DEFAULT 'pending',
    "read_at" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "idempotency_key" VARCHAR(100) NOT NULL,
    "user_id" UUID NOT NULL,
    "endpoint" VARCHAR(100) NOT NULL,
    "request_hash" VARCHAR(64),
    "response_status" INTEGER,
    "response_body" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "memory_id" UUID,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("idempotency_key")
);

-- CreateTable
CREATE TABLE "ai_cost_tracking" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "operation" VARCHAR(50) NOT NULL,
    "tokens_used" INTEGER NOT NULL,
    "cost_cents" DECIMAL(10,4) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "memory_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_cost_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "memory_types_code_key" ON "memory_types"("code");

-- CreateIndex
CREATE INDEX "memories_user_id_state_idx" ON "memories"("user_id", "state");

-- CreateIndex
CREATE INDEX "memories_user_id_content_hash_created_at_idx" ON "memories"("user_id", "content_hash", "created_at");

-- CreateIndex
CREATE INDEX "memories_occurred_at_idx" ON "memories"("occurred_at");

-- CreateIndex
CREATE INDEX "memories_location_id_idx" ON "memories"("location_id");

-- CreateIndex
CREATE INDEX "memories_person_id_idx" ON "memories"("person_id");

-- CreateIndex
CREATE INDEX "memory_type_assignments_memory_type_id_idx" ON "memory_type_assignments"("memory_type_id");

-- CreateIndex
CREATE INDEX "words_word_idx" ON "words"("word");

-- CreateIndex
CREATE INDEX "memory_links_source_id_idx" ON "memory_links"("source_id");

-- CreateIndex
CREATE INDEX "memory_links_target_id_idx" ON "memory_links"("target_id");

-- CreateIndex
CREATE INDEX "memory_links_link_type_idx" ON "memory_links"("link_type");

-- CreateIndex
CREATE UNIQUE INDEX "memory_links_source_id_target_id_link_type_key" ON "memory_links"("source_id", "target_id", "link_type");

-- CreateIndex
CREATE INDEX "embeddings_user_id_idx" ON "embeddings"("user_id");

-- CreateIndex
CREATE INDEX "embeddings_memory_id_idx" ON "embeddings"("memory_id");

-- CreateIndex
CREATE INDEX "reminders_user_id_status_read_at_idx" ON "reminders"("user_id", "status", "read_at");

-- CreateIndex
CREATE INDEX "reminders_user_id_status_read_at_dismissed_at_idx" ON "reminders"("user_id", "status", "read_at", "dismissed_at");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "idempotency_keys_user_id_idx" ON "idempotency_keys"("user_id");

-- CreateIndex
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");

-- CreateIndex
CREATE INDEX "ai_cost_tracking_date_idx" ON "ai_cost_tracking"("date");

-- CreateIndex
CREATE INDEX "ai_cost_tracking_user_id_date_idx" ON "ai_cost_tracking"("user_id", "date");

-- AddForeignKey
ALTER TABLE "user_usage" ADD CONSTRAINT "user_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_type_assignments" ADD CONSTRAINT "memory_type_assignments_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_type_assignments" ADD CONSTRAINT "memory_type_assignments_memory_type_id_fkey" FOREIGN KEY ("memory_type_id") REFERENCES "memory_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "words" ADD CONSTRAINT "words_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_links" ADD CONSTRAINT "memory_links_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_links" ADD CONSTRAINT "memory_links_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_cost_tracking" ADD CONSTRAINT "ai_cost_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_cost_tracking" ADD CONSTRAINT "ai_cost_tracking_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
