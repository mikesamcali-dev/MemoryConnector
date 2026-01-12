-- CreateTable
CREATE TABLE "trainings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "tags" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_training_links" (
    "id" UUID NOT NULL,
    "memory_id" UUID NOT NULL,
    "training_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_training_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_image_links" (
    "id" UUID NOT NULL,
    "training_id" UUID NOT NULL,
    "image_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_image_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_url_page_links" (
    "id" UUID NOT NULL,
    "training_id" UUID NOT NULL,
    "url_page_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_url_page_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_youtube_video_links" (
    "id" UUID NOT NULL,
    "training_id" UUID NOT NULL,
    "youtube_video_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_youtube_video_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_tiktok_video_links" (
    "id" UUID NOT NULL,
    "training_id" UUID NOT NULL,
    "tiktok_video_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_tiktok_video_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_decks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "training_id" UUID NOT NULL,
    "title" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_lessons" (
    "id" UUID NOT NULL,
    "training_deck_id" UUID NOT NULL,
    "memory_id" UUID,
    "image_id" UUID,
    "url_page_id" UUID,
    "youtube_video_id" UUID,
    "tiktok_video_id" UUID,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trainings_user_id_idx" ON "trainings"("user_id");

-- CreateIndex
CREATE INDEX "trainings_user_id_name_idx" ON "trainings"("user_id", "name");

-- CreateIndex
CREATE INDEX "memory_training_links_memory_id_idx" ON "memory_training_links"("memory_id");

-- CreateIndex
CREATE INDEX "memory_training_links_training_id_idx" ON "memory_training_links"("training_id");

-- CreateIndex
CREATE UNIQUE INDEX "memory_training_links_memory_id_training_id_key" ON "memory_training_links"("memory_id", "training_id");

-- CreateIndex
CREATE INDEX "training_image_links_training_id_idx" ON "training_image_links"("training_id");

-- CreateIndex
CREATE INDEX "training_image_links_image_id_idx" ON "training_image_links"("image_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_image_links_training_id_image_id_key" ON "training_image_links"("training_id", "image_id");

-- CreateIndex
CREATE INDEX "training_url_page_links_training_id_idx" ON "training_url_page_links"("training_id");

-- CreateIndex
CREATE INDEX "training_url_page_links_url_page_id_idx" ON "training_url_page_links"("url_page_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_url_page_links_training_id_url_page_id_key" ON "training_url_page_links"("training_id", "url_page_id");

-- CreateIndex
CREATE INDEX "training_youtube_video_links_training_id_idx" ON "training_youtube_video_links"("training_id");

-- CreateIndex
CREATE INDEX "training_youtube_video_links_youtube_video_id_idx" ON "training_youtube_video_links"("youtube_video_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_youtube_video_links_training_id_youtube_video_id_key" ON "training_youtube_video_links"("training_id", "youtube_video_id");

-- CreateIndex
CREATE INDEX "training_tiktok_video_links_training_id_idx" ON "training_tiktok_video_links"("training_id");

-- CreateIndex
CREATE INDEX "training_tiktok_video_links_tiktok_video_id_idx" ON "training_tiktok_video_links"("tiktok_video_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_tiktok_video_links_training_id_tiktok_video_id_key" ON "training_tiktok_video_links"("training_id", "tiktok_video_id");

-- CreateIndex
CREATE INDEX "training_decks_user_id_created_at_idx" ON "training_decks"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "training_decks_training_id_idx" ON "training_decks"("training_id");

-- CreateIndex
CREATE INDEX "training_lessons_training_deck_id_sort_order_idx" ON "training_lessons"("training_deck_id", "sort_order");

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_training_links" ADD CONSTRAINT "memory_training_links_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_training_links" ADD CONSTRAINT "memory_training_links_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_image_links" ADD CONSTRAINT "training_image_links_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_image_links" ADD CONSTRAINT "training_image_links_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_url_page_links" ADD CONSTRAINT "training_url_page_links_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_url_page_links" ADD CONSTRAINT "training_url_page_links_url_page_id_fkey" FOREIGN KEY ("url_page_id") REFERENCES "url_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_youtube_video_links" ADD CONSTRAINT "training_youtube_video_links_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_youtube_video_links" ADD CONSTRAINT "training_youtube_video_links_youtube_video_id_fkey" FOREIGN KEY ("youtube_video_id") REFERENCES "youtube_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_tiktok_video_links" ADD CONSTRAINT "training_tiktok_video_links_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_tiktok_video_links" ADD CONSTRAINT "training_tiktok_video_links_tiktok_video_id_fkey" FOREIGN KEY ("tiktok_video_id") REFERENCES "tiktok_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_decks" ADD CONSTRAINT "training_decks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_decks" ADD CONSTRAINT "training_decks_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_lessons" ADD CONSTRAINT "training_lessons_training_deck_id_fkey" FOREIGN KEY ("training_deck_id") REFERENCES "training_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_lessons" ADD CONSTRAINT "training_lessons_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_lessons" ADD CONSTRAINT "training_lessons_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_lessons" ADD CONSTRAINT "training_lessons_url_page_id_fkey" FOREIGN KEY ("url_page_id") REFERENCES "url_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_lessons" ADD CONSTRAINT "training_lessons_youtube_video_id_fkey" FOREIGN KEY ("youtube_video_id") REFERENCES "youtube_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_lessons" ADD CONSTRAINT "training_lessons_tiktok_video_id_fkey" FOREIGN KEY ("tiktok_video_id") REFERENCES "tiktok_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
