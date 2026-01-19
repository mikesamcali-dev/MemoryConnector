-- CreateEnum
CREATE TYPE "SamReviewType" AS ENUM ('recognition', 'free_recall');

-- CreateTable
CREATE TABLE "sam_review_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "memory_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "current_interval" INTEGER NOT NULL DEFAULT 1,
    "ease_factor" REAL NOT NULL DEFAULT 2.3,
    "next_review_date" TIMESTAMP(3) NOT NULL,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "successful_reviews" INTEGER NOT NULL DEFAULT 0,
    "consecutive_successes" INTEGER NOT NULL DEFAULT 0,
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "is_paused" BOOLEAN NOT NULL DEFAULT false,
    "last_reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sam_review_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sam_review_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schedule_id" UUID NOT NULL,
    "memory_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "was_successful" BOOLEAN NOT NULL,
    "review_type" "SamReviewType" NOT NULL,
    "response_time_ms" INTEGER,
    "interval_before" INTEGER NOT NULL,
    "interval_after" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sam_review_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sam_review_schedules_memory_id_key" ON "sam_review_schedules"("memory_id");

-- CreateIndex
CREATE INDEX "sam_review_schedules_user_id_next_review_date_idx" ON "sam_review_schedules"("user_id", "next_review_date");

-- CreateIndex
CREATE INDEX "sam_review_schedules_next_review_date_is_paused_idx" ON "sam_review_schedules"("next_review_date", "is_paused");

-- CreateIndex
CREATE INDEX "sam_review_attempts_user_id_created_at_idx" ON "sam_review_attempts"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "sam_review_attempts_memory_id_created_at_idx" ON "sam_review_attempts"("memory_id", "created_at");

-- CreateIndex
CREATE INDEX "sam_review_attempts_schedule_id_idx" ON "sam_review_attempts"("schedule_id");

-- AddForeignKey
ALTER TABLE "sam_review_schedules" ADD CONSTRAINT "sam_review_schedules_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "sam_memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_review_schedules" ADD CONSTRAINT "sam_review_schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_review_attempts" ADD CONSTRAINT "sam_review_attempts_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "sam_review_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_review_attempts" ADD CONSTRAINT "sam_review_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
