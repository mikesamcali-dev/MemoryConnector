-- CreateTable
CREATE TABLE "memory_person_links" (
    "id" UUID NOT NULL,
    "memory_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_person_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_url_page_links" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "url_page_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "person_url_page_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_youtube_video_links" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "youtube_video_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "person_youtube_video_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_tiktok_video_links" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "tiktok_video_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "person_tiktok_video_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "memory_person_links_memory_id_idx" ON "memory_person_links"("memory_id");

-- CreateIndex
CREATE INDEX "memory_person_links_person_id_idx" ON "memory_person_links"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "memory_person_links_memory_id_person_id_key" ON "memory_person_links"("memory_id", "person_id");

-- CreateIndex
CREATE INDEX "person_url_page_links_person_id_idx" ON "person_url_page_links"("person_id");

-- CreateIndex
CREATE INDEX "person_url_page_links_url_page_id_idx" ON "person_url_page_links"("url_page_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_url_page_links_person_id_url_page_id_key" ON "person_url_page_links"("person_id", "url_page_id");

-- CreateIndex
CREATE INDEX "person_youtube_video_links_person_id_idx" ON "person_youtube_video_links"("person_id");

-- CreateIndex
CREATE INDEX "person_youtube_video_links_youtube_video_id_idx" ON "person_youtube_video_links"("youtube_video_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_youtube_video_links_person_id_youtube_video_id_key" ON "person_youtube_video_links"("person_id", "youtube_video_id");

-- CreateIndex
CREATE INDEX "person_tiktok_video_links_person_id_idx" ON "person_tiktok_video_links"("person_id");

-- CreateIndex
CREATE INDEX "person_tiktok_video_links_tiktok_video_id_idx" ON "person_tiktok_video_links"("tiktok_video_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_tiktok_video_links_person_id_tiktok_video_id_key" ON "person_tiktok_video_links"("person_id", "tiktok_video_id");

-- AddForeignKey
ALTER TABLE "memory_person_links" ADD CONSTRAINT "memory_person_links_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_person_links" ADD CONSTRAINT "memory_person_links_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_url_page_links" ADD CONSTRAINT "person_url_page_links_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_url_page_links" ADD CONSTRAINT "person_url_page_links_url_page_id_fkey" FOREIGN KEY ("url_page_id") REFERENCES "url_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_youtube_video_links" ADD CONSTRAINT "person_youtube_video_links_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_youtube_video_links" ADD CONSTRAINT "person_youtube_video_links_youtube_video_id_fkey" FOREIGN KEY ("youtube_video_id") REFERENCES "youtube_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_tiktok_video_links" ADD CONSTRAINT "person_tiktok_video_links_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_tiktok_video_links" ADD CONSTRAINT "person_tiktok_video_links_tiktok_video_id_fkey" FOREIGN KEY ("tiktok_video_id") REFERENCES "tiktok_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
