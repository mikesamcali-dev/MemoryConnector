-- AlterTable
ALTER TABLE "memories" ADD COLUMN     "twitter_post_id" UUID;

-- AlterTable
ALTER TABLE "training_lessons" ADD COLUMN     "twitter_post_id" UUID;

-- CreateTable
CREATE TABLE "person_twitter_post_links" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "twitter_post_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "person_twitter_post_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_twitter_post_links" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "twitter_post_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_twitter_post_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twitter_posts" (
    "id" UUID NOT NULL,
    "platform" VARCHAR(16) NOT NULL DEFAULT 'twitter',
    "twitter_post_id" VARCHAR(64) NOT NULL,
    "canonical_url" VARCHAR(2048) NOT NULL,
    "text" TEXT NOT NULL,
    "thumbnail_url" VARCHAR(2048),
    "creator_display_name" VARCHAR(256) NOT NULL,
    "creator_username" VARCHAR(128),
    "creator_id" VARCHAR(64),
    "published_at" TIMESTAMP(3) NOT NULL,
    "language_code" VARCHAR(12),
    "view_count" BIGINT,
    "like_count" BIGINT,
    "reply_count" BIGINT,
    "retweet_count" BIGINT,
    "quote_count" BIGINT,
    "bookmark_count" BIGINT,
    "captured_at" TIMESTAMP(3),
    "has_media" BOOLEAN NOT NULL DEFAULT false,
    "media_urls" JSONB,
    "media_types" JSONB,
    "hashtags" JSONB,
    "mentions" JSONB,
    "external_links" JSONB,
    "summary" TEXT,
    "topics" JSONB,
    "sentiment" VARCHAR(32),
    "is_reply" BOOLEAN NOT NULL DEFAULT false,
    "is_retweet" BOOLEAN NOT NULL DEFAULT false,
    "is_quote" BOOLEAN NOT NULL DEFAULT false,
    "content_hash" VARCHAR(64),
    "ingestion_status" "IngestionStatus" NOT NULL,
    "ingestion_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_ingestion_error" TEXT,
    "ingested_at" TIMESTAMP(3),
    "last_enriched_at" TIMESTAMP(3),
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "twitter_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_twitter_post_links" (
    "id" UUID NOT NULL,
    "training_id" UUID NOT NULL,
    "twitter_post_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_twitter_post_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "person_twitter_post_links_person_id_idx" ON "person_twitter_post_links"("person_id");

-- CreateIndex
CREATE INDEX "person_twitter_post_links_twitter_post_id_idx" ON "person_twitter_post_links"("twitter_post_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_twitter_post_links_person_id_twitter_post_id_key" ON "person_twitter_post_links"("person_id", "twitter_post_id");

-- CreateIndex
CREATE INDEX "project_twitter_post_links_project_id_idx" ON "project_twitter_post_links"("project_id");

-- CreateIndex
CREATE INDEX "project_twitter_post_links_twitter_post_id_idx" ON "project_twitter_post_links"("twitter_post_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_twitter_post_links_project_id_twitter_post_id_key" ON "project_twitter_post_links"("project_id", "twitter_post_id");

-- CreateIndex
CREATE INDEX "twitter_posts_user_id_idx" ON "twitter_posts"("user_id");

-- CreateIndex
CREATE INDEX "twitter_posts_creator_id_idx" ON "twitter_posts"("creator_id");

-- CreateIndex
CREATE INDEX "twitter_posts_creator_username_idx" ON "twitter_posts"("creator_username");

-- CreateIndex
CREATE INDEX "twitter_posts_published_at_idx" ON "twitter_posts"("published_at" DESC);

-- CreateIndex
CREATE INDEX "twitter_posts_ingested_at_idx" ON "twitter_posts"("ingested_at" DESC);

-- CreateIndex
CREATE INDEX "twitter_posts_ingestion_status_idx" ON "twitter_posts"("ingestion_status");

-- CreateIndex
CREATE INDEX "twitter_posts_content_hash_idx" ON "twitter_posts"("content_hash");

-- CreateIndex
CREATE UNIQUE INDEX "twitter_posts_platform_twitter_post_id_key" ON "twitter_posts"("platform", "twitter_post_id");

-- CreateIndex
CREATE UNIQUE INDEX "twitter_posts_canonical_url_key" ON "twitter_posts"("canonical_url");

-- CreateIndex
CREATE INDEX "training_twitter_post_links_training_id_idx" ON "training_twitter_post_links"("training_id");

-- CreateIndex
CREATE INDEX "training_twitter_post_links_twitter_post_id_idx" ON "training_twitter_post_links"("twitter_post_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_twitter_post_links_training_id_twitter_post_id_key" ON "training_twitter_post_links"("training_id", "twitter_post_id");

-- CreateIndex
CREATE INDEX "memories_twitter_post_id_idx" ON "memories"("twitter_post_id");

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_twitter_post_id_fkey" FOREIGN KEY ("twitter_post_id") REFERENCES "twitter_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_twitter_post_links" ADD CONSTRAINT "person_twitter_post_links_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_twitter_post_links" ADD CONSTRAINT "person_twitter_post_links_twitter_post_id_fkey" FOREIGN KEY ("twitter_post_id") REFERENCES "twitter_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_twitter_post_links" ADD CONSTRAINT "project_twitter_post_links_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_twitter_post_links" ADD CONSTRAINT "project_twitter_post_links_twitter_post_id_fkey" FOREIGN KEY ("twitter_post_id") REFERENCES "twitter_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twitter_posts" ADD CONSTRAINT "twitter_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_twitter_post_links" ADD CONSTRAINT "training_twitter_post_links_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_twitter_post_links" ADD CONSTRAINT "training_twitter_post_links_twitter_post_id_fkey" FOREIGN KEY ("twitter_post_id") REFERENCES "twitter_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_lessons" ADD CONSTRAINT "training_lessons_twitter_post_id_fkey" FOREIGN KEY ("twitter_post_id") REFERENCES "twitter_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
