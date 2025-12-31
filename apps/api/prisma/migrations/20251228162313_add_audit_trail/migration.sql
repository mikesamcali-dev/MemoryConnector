/*
  Warnings:

  - You are about to drop the column `vector` on the `embeddings` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "embeddings_vector_idx";

-- AlterTable
ALTER TABLE "embeddings" DROP COLUMN "vector";

-- AlterTable
ALTER TABLE "excluded_words" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "audit_trail" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "user_id" UUID,
    "actor_type" VARCHAR(20) NOT NULL DEFAULT 'USER',
    "actor_email" VARCHAR(255),
    "impersonator_id" UUID,
    "event_type" VARCHAR(50) NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "entity_name" VARCHAR(100),
    "entity_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration_ms" INTEGER,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "device_id" VARCHAR(100),
    "geo_country" VARCHAR(2),
    "geo_city" VARCHAR(100),
    "request_id" VARCHAR(100),
    "session_id" VARCHAR(100),
    "correlation_id" VARCHAR(100),
    "trace_id" VARCHAR(100),
    "success" BOOLEAN NOT NULL DEFAULT true,
    "status_code" INTEGER,
    "error_code" VARCHAR(50),
    "error_message" TEXT,
    "exception_type" VARCHAR(255),
    "before_json" JSONB,
    "after_json" JSONB,
    "diff_json" JSONB,
    "request_json" JSONB,
    "response_json" JSONB,
    "logging_level" VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    "redacted_fields" TEXT[],
    "truncated_fields" TEXT[],
    "data_hash" VARCHAR(64),
    "tags" JSONB,
    "notes" TEXT,

    CONSTRAINT "audit_trail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_trail_user_id_idx" ON "audit_trail"("user_id");

-- CreateIndex
CREATE INDEX "audit_trail_created_at_idx" ON "audit_trail"("created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_trail_entity_name_entity_id_idx" ON "audit_trail"("entity_name", "entity_id");

-- CreateIndex
CREATE INDEX "audit_trail_request_id_idx" ON "audit_trail"("request_id");

-- CreateIndex
CREATE INDEX "audit_trail_event_type_idx" ON "audit_trail"("event_type");

-- CreateIndex
CREATE INDEX "audit_trail_success_created_at_idx" ON "audit_trail"("success", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_trail_actor_type_created_at_idx" ON "audit_trail"("actor_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_trail_user_id_created_at_idx" ON "audit_trail"("user_id", "created_at" DESC);
