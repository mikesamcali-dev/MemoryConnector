-- CreateEnum
CREATE TYPE "TranscriptStatus" AS ENUM ('none', 'partial', 'full', 'failed');

-- CreateEnum
CREATE TYPE "TranscriptSource" AS ENUM ('captions', 'auto', 'asr', 'manual', 'unknown');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('queued', 'ingested', 'retry', 'failed', 'blocked');

-- AlterTable
ALTER TABLE "memories" ADD COLUMN     "youtube_video_id" UUID;

-- CreateTable
CREATE TABLE "youtube_videos" (
    "id" UUID NOT NULL,
    "platform" VARCHAR(16) NOT NULL DEFAULT 'youtube',
    "youtube_video_id" VARCHAR(16) NOT NULL,
    "canonical_url" VARCHAR(2048) NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "description" TEXT,
    "thumbnail_url" VARCHAR(2048),
    "creator_display_name" VARCHAR(256) NOT NULL,
    "channel_id" VARCHAR(64),
    "published_at" TIMESTAMP(3) NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "language_code" VARCHAR(12) NOT NULL,
    "transcript_status" "TranscriptStatus" NOT NULL,
    "transcript_source" "TranscriptSource" NOT NULL,
    "transcript_text" TEXT,
    "transcript_segments" JSONB,
    "summary" TEXT,
    "topics" JSONB,
    "chapters" JSONB,
    "view_count" BIGINT,
    "like_count" BIGINT,
    "category_id" VARCHAR(32),
    "tags" JSONB,
    "external_links" JSONB,
    "content_hash" VARCHAR(64),
    "ingestion_status" "IngestionStatus" NOT NULL,
    "ingestion_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_ingestion_error" TEXT,
    "ingested_at" TIMESTAMP(3),
    "last_enriched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "youtube_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "youtube_videos_channel_id_idx" ON "youtube_videos"("channel_id");

-- CreateIndex
CREATE INDEX "youtube_videos_published_at_idx" ON "youtube_videos"("published_at" DESC);

-- CreateIndex
CREATE INDEX "youtube_videos_ingested_at_idx" ON "youtube_videos"("ingested_at" DESC);

-- CreateIndex
CREATE INDEX "youtube_videos_language_code_idx" ON "youtube_videos"("language_code");

-- CreateIndex
CREATE INDEX "youtube_videos_ingestion_status_idx" ON "youtube_videos"("ingestion_status");

-- CreateIndex
CREATE INDEX "youtube_videos_content_hash_idx" ON "youtube_videos"("content_hash");

-- CreateIndex
CREATE UNIQUE INDEX "youtube_videos_platform_youtube_video_id_key" ON "youtube_videos"("platform", "youtube_video_id");

-- CreateIndex
CREATE UNIQUE INDEX "youtube_videos_canonical_url_key" ON "youtube_videos"("canonical_url");

-- CreateIndex
CREATE INDEX "memories_youtube_video_id_idx" ON "memories"("youtube_video_id");

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_youtube_video_id_fkey" FOREIGN KEY ("youtube_video_id") REFERENCES "youtube_videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
