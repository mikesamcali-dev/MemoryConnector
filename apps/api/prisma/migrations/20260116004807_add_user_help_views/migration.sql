-- CreateTable
CREATE TABLE "user_help_views" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "page_key" VARCHAR(100) NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "last_view_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_help_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_help_views_user_id_idx" ON "user_help_views"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_help_views_user_id_page_key_key" ON "user_help_views"("user_id", "page_key");

-- AddForeignKey
ALTER TABLE "user_help_views" ADD CONSTRAINT "user_help_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
