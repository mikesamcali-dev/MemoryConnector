-- AlterTable
ALTER TABLE "memories" ADD COLUMN     "ease_factor" DOUBLE PRECISION DEFAULT 2.5,
ADD COLUMN     "lapse_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_reviewed_at" TIMESTAMP(3),
ADD COLUMN     "next_review_at" TIMESTAMP(3),
ADD COLUMN     "review_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "review_interval" INTEGER DEFAULT 1;

-- CreateTable
CREATE TABLE "user_stats" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "current_streak_days" INTEGER NOT NULL DEFAULT 0,
    "longest_streak_days" INTEGER NOT NULL DEFAULT 0,
    "last_capture_date" TIMESTAMP(3),
    "total_reviews_completed" INTEGER NOT NULL DEFAULT 0,
    "total_reviews_again" INTEGER NOT NULL DEFAULT 0,
    "total_reviews_hard" INTEGER NOT NULL DEFAULT 0,
    "total_reviews_good" INTEGER NOT NULL DEFAULT 0,
    "total_reviews_easy" INTEGER NOT NULL DEFAULT 0,
    "total_memories_created" INTEGER NOT NULL DEFAULT 0,
    "total_links_created" INTEGER NOT NULL DEFAULT 0,
    "sentiment_positive" INTEGER NOT NULL DEFAULT 0,
    "sentiment_neutral" INTEGER NOT NULL DEFAULT 0,
    "sentiment_negative" INTEGER NOT NULL DEFAULT 0,
    "achievements_unlocked" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_stats_user_id_key" ON "user_stats"("user_id");

-- CreateIndex
CREATE INDEX "memories_user_id_next_review_at_idx" ON "memories"("user_id", "next_review_at");

-- AddForeignKey
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
