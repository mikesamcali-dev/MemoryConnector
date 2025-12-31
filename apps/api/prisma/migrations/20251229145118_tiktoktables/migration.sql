-- AlterTable
ALTER TABLE "memories" ADD COLUMN     "tiktok_video_id" UUID;

-- CreateTable
CREATE TABLE "tiktok_videos" (
    "id" UUID NOT NULL,
    "platform" VARCHAR(16) NOT NULL DEFAULT 'tiktok',
    "tiktok_video_id" VARCHAR(64) NOT NULL,
    "canonical_url" VARCHAR(2048) NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "description" TEXT,
    "thumbnail_url" VARCHAR(2048),
    "creator_display_name" VARCHAR(256) NOT NULL,
    "creator_username" VARCHAR(128),
    "creator_id" VARCHAR(64),
    "published_at" TIMESTAMP(3),
    "duration_seconds" INTEGER,
    "summary" TEXT,
    "topics" JSONB,
    "music_info" JSONB,
    "view_count" BIGINT,
    "like_count" BIGINT,
    "share_count" BIGINT,
    "comment_count" BIGINT,
    "captured_at" TIMESTAMP(3),
    "hashtags" JSONB,
    "mentions" JSONB,
    "external_links" JSONB,
    "content_hash" VARCHAR(64),
    "ingestion_status" "IngestionStatus" NOT NULL,
    "ingestion_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_ingestion_error" TEXT,
    "ingested_at" TIMESTAMP(3),
    "last_enriched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tiktok_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tiktok_videos_creator_id_idx" ON "tiktok_videos"("creator_id");

-- CreateIndex
CREATE INDEX "tiktok_videos_creator_username_idx" ON "tiktok_videos"("creator_username");

-- CreateIndex
CREATE INDEX "tiktok_videos_published_at_idx" ON "tiktok_videos"("published_at" DESC);

-- CreateIndex
CREATE INDEX "tiktok_videos_ingested_at_idx" ON "tiktok_videos"("ingested_at" DESC);

-- CreateIndex
CREATE INDEX "tiktok_videos_ingestion_status_idx" ON "tiktok_videos"("ingestion_status");

-- CreateIndex
CREATE INDEX "tiktok_videos_content_hash_idx" ON "tiktok_videos"("content_hash");

-- CreateIndex
CREATE UNIQUE INDEX "tiktok_videos_platform_tiktok_video_id_key" ON "tiktok_videos"("platform", "tiktok_video_id");

-- CreateIndex
CREATE UNIQUE INDEX "tiktok_videos_canonical_url_key" ON "tiktok_videos"("canonical_url");

-- CreateIndex
CREATE INDEX "memories_tiktok_video_id_idx" ON "memories"("tiktok_video_id");

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_tiktok_video_id_fkey" FOREIGN KEY ("tiktok_video_id") REFERENCES "tiktok_videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
