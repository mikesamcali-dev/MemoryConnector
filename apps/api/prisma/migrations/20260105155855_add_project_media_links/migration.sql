-- CreateTable
CREATE TABLE "project_image_links" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "image_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_image_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_url_page_links" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "url_page_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_url_page_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_youtube_video_links" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "youtube_video_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_youtube_video_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_tiktok_video_links" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "tiktok_video_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_tiktok_video_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_image_links_project_id_idx" ON "project_image_links"("project_id");

-- CreateIndex
CREATE INDEX "project_image_links_image_id_idx" ON "project_image_links"("image_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_image_links_project_id_image_id_key" ON "project_image_links"("project_id", "image_id");

-- CreateIndex
CREATE INDEX "project_url_page_links_project_id_idx" ON "project_url_page_links"("project_id");

-- CreateIndex
CREATE INDEX "project_url_page_links_url_page_id_idx" ON "project_url_page_links"("url_page_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_url_page_links_project_id_url_page_id_key" ON "project_url_page_links"("project_id", "url_page_id");

-- CreateIndex
CREATE INDEX "project_youtube_video_links_project_id_idx" ON "project_youtube_video_links"("project_id");

-- CreateIndex
CREATE INDEX "project_youtube_video_links_youtube_video_id_idx" ON "project_youtube_video_links"("youtube_video_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_youtube_video_links_project_id_youtube_video_id_key" ON "project_youtube_video_links"("project_id", "youtube_video_id");

-- CreateIndex
CREATE INDEX "project_tiktok_video_links_project_id_idx" ON "project_tiktok_video_links"("project_id");

-- CreateIndex
CREATE INDEX "project_tiktok_video_links_tiktok_video_id_idx" ON "project_tiktok_video_links"("tiktok_video_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_tiktok_video_links_project_id_tiktok_video_id_key" ON "project_tiktok_video_links"("project_id", "tiktok_video_id");

-- AddForeignKey
ALTER TABLE "project_image_links" ADD CONSTRAINT "project_image_links_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_image_links" ADD CONSTRAINT "project_image_links_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_url_page_links" ADD CONSTRAINT "project_url_page_links_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_url_page_links" ADD CONSTRAINT "project_url_page_links_url_page_id_fkey" FOREIGN KEY ("url_page_id") REFERENCES "url_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_youtube_video_links" ADD CONSTRAINT "project_youtube_video_links_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_youtube_video_links" ADD CONSTRAINT "project_youtube_video_links_youtube_video_id_fkey" FOREIGN KEY ("youtube_video_id") REFERENCES "youtube_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tiktok_video_links" ADD CONSTRAINT "project_tiktok_video_links_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tiktok_video_links" ADD CONSTRAINT "project_tiktok_video_links_tiktok_video_id_fkey" FOREIGN KEY ("tiktok_video_id") REFERENCES "tiktok_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
