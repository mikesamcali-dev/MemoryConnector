-- CreateTable
CREATE TABLE "url_pages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "url_hash" VARCHAR(64) NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "summary" TEXT,
    "content" TEXT,
    "author" VARCHAR(255),
    "published_at" TIMESTAMP(3),
    "site_name" VARCHAR(255),
    "image_url" TEXT,
    "tags" JSONB,
    "metadata" JSONB,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "url_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_url_page_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "memory_id" UUID NOT NULL,
    "url_page_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_url_page_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "url_pages_user_id_idx" ON "url_pages"("user_id");

-- CreateIndex
CREATE INDEX "url_pages_url_hash_idx" ON "url_pages"("url_hash");

-- CreateIndex
CREATE INDEX "url_pages_url_idx" ON "url_pages"("url");

-- CreateIndex
CREATE UNIQUE INDEX "url_pages_user_id_url_hash_key" ON "url_pages"("user_id", "url_hash");

-- CreateIndex
CREATE INDEX "memory_url_page_links_memory_id_idx" ON "memory_url_page_links"("memory_id");

-- CreateIndex
CREATE INDEX "memory_url_page_links_url_page_id_idx" ON "memory_url_page_links"("url_page_id");

-- CreateIndex
CREATE UNIQUE INDEX "memory_url_page_links_memory_id_url_page_id_key" ON "memory_url_page_links"("memory_id", "url_page_id");

-- AddForeignKey
ALTER TABLE "url_pages" ADD CONSTRAINT "url_pages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_url_page_links" ADD CONSTRAINT "memory_url_page_links_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_url_page_links" ADD CONSTRAINT "memory_url_page_links_url_page_id_fkey" FOREIGN KEY ("url_page_id") REFERENCES "url_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
