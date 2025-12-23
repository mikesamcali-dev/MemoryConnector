-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('free', 'premium');

-- CreateEnum
CREATE TYPE "MemoryType" AS ENUM ('note', 'person', 'event', 'place', 'task');

-- CreateEnum
CREATE TYPE "MemoryState" AS ENUM ('SAVED', 'DRAFT', 'DELETED');

-- CreateEnum
CREATE TYPE "EnrichmentStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'queued_budget');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('pending', 'sent', 'cancelled');

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
CREATE TABLE "memories" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "MemoryType",
    "text_content" TEXT,
    "image_url" TEXT,
    "state" "MemoryState" NOT NULL DEFAULT 'SAVED',
    "content_hash" VARCHAR(32),
    "enrichment_status" "EnrichmentStatus" NOT NULL DEFAULT 'pending',
    "enrichment_queued_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memories_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "memories_user_id_state_idx" ON "memories"("user_id", "state");

-- CreateIndex
CREATE INDEX "memories_user_id_content_hash_created_at_idx" ON "memories"("user_id", "content_hash", "created_at");

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

