-- CreateEnum for SAM Reliability
CREATE TYPE "SamReliability" AS ENUM ('unverified', 'inferred', 'confirmed', 'contested');

-- CreateEnum for SAM Decay Type
CREATE TYPE "SamDecayType" AS ENUM ('exponential', 'none');

-- CreateEnum for SAM Source Type
CREATE TYPE "SamSourceType" AS ENUM ('user', 'system', 'import', 'derived', 'doc');

-- CreateTable sam_memories
CREATE TABLE "sam_memories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "content" TEXT NOT NULL,
    "summary" VARCHAR(320) NOT NULL,
    "canonical_phrases" TEXT[] NOT NULL,
    "tags" TEXT[] NOT NULL,
    "source_type" "SamSourceType" NOT NULL,
    "source_ref" VARCHAR(200) NOT NULL,
    "source_uri" VARCHAR(500),
    "confidence_score" REAL NOT NULL,
    "reliability" "SamReliability" NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMP(3),
    "archive_flag" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "embedding_model" VARCHAR(80) NOT NULL,
    "embedding_dims" INTEGER NOT NULL,
    "embedding_ref" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sam_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable sam_context_windows
CREATE TABLE "sam_context_windows" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "memory_id" UUID NOT NULL,
    "applies_to" TEXT[] NOT NULL,
    "excludes" TEXT[] NOT NULL,

    CONSTRAINT "sam_context_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable sam_decay_policies
CREATE TABLE "sam_decay_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "memory_id" UUID NOT NULL,
    "type" "SamDecayType" NOT NULL,
    "half_life_days" INTEGER NOT NULL,
    "min_confidence" REAL NOT NULL,

    CONSTRAINT "sam_decay_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable sam_training_examples
CREATE TABLE "sam_training_examples" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "memory_id" UUID NOT NULL,
    "example_id" VARCHAR(64) NOT NULL,
    "user_prompt" VARCHAR(600) NOT NULL,
    "assistant" VARCHAR(1200) NOT NULL,
    "assertions" TEXT[] NOT NULL,
    "last_tested_at" TIMESTAMP(3),
    "pass_rate" REAL NOT NULL DEFAULT 0,

    CONSTRAINT "sam_training_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable sam_memory_versions
CREATE TABLE "sam_memory_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "memory_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "content" TEXT NOT NULL,
    "summary" VARCHAR(320) NOT NULL,
    "canonical_phrases" TEXT[] NOT NULL,
    "tags" TEXT[] NOT NULL,
    "confidence_score" REAL NOT NULL,
    "reliability" "SamReliability" NOT NULL,
    "changelog" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sam_memory_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable sam_audit_events
CREATE TABLE "sam_audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "memory_id" UUID NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sam_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sam_memories_user_id_idx" ON "sam_memories"("user_id");
CREATE INDEX "sam_memories_user_id_archive_flag_idx" ON "sam_memories"("user_id", "archive_flag");
CREATE INDEX "sam_memories_user_id_tags_idx" ON "sam_memories"("user_id", "tags");
CREATE INDEX "sam_memories_updated_at_idx" ON "sam_memories"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "sam_context_windows_memory_id_key" ON "sam_context_windows"("memory_id");

-- CreateIndex
CREATE UNIQUE INDEX "sam_decay_policies_memory_id_key" ON "sam_decay_policies"("memory_id");

-- CreateIndex
CREATE INDEX "sam_training_examples_memory_id_idx" ON "sam_training_examples"("memory_id");

-- CreateIndex
CREATE INDEX "sam_memory_versions_memory_id_version_idx" ON "sam_memory_versions"("memory_id", "version");

-- CreateIndex
CREATE INDEX "sam_audit_events_memory_id_created_at_idx" ON "sam_audit_events"("memory_id", "created_at");
CREATE INDEX "sam_audit_events_created_at_idx" ON "sam_audit_events"("created_at");

-- AddForeignKey
ALTER TABLE "sam_memories" ADD CONSTRAINT "sam_memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_context_windows" ADD CONSTRAINT "sam_context_windows_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "sam_memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_decay_policies" ADD CONSTRAINT "sam_decay_policies_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "sam_memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_training_examples" ADD CONSTRAINT "sam_training_examples_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "sam_memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_memory_versions" ADD CONSTRAINT "sam_memory_versions_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "sam_memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_audit_events" ADD CONSTRAINT "sam_audit_events_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "sam_memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
