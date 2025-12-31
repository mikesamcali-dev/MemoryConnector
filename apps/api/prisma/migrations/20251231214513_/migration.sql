/*
  Warnings:

  - The primary key for the `words` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `memory_id` on the `words` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[word]` on the table `words` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `words` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterEnum
ALTER TYPE "ReminderStatus" ADD VALUE 'slide';

-- DropForeignKey
ALTER TABLE "words" DROP CONSTRAINT "words_memory_id_fkey";

-- AlterTable
ALTER TABLE "image_faces" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "image_person_links" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "images" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "memory_image_links" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "memory_url_page_links" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "url_pages" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "words" DROP CONSTRAINT "words_pkey",
DROP COLUMN "memory_id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "words_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "memory_word_links" (
    "id" UUID NOT NULL,
    "memory_id" UUID NOT NULL,
    "word_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_word_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slide_decks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slide_decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slides" (
    "id" UUID NOT NULL,
    "slide_deck_id" UUID NOT NULL,
    "reminder_id" UUID NOT NULL,
    "memory_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "memory_word_links_memory_id_idx" ON "memory_word_links"("memory_id");

-- CreateIndex
CREATE INDEX "memory_word_links_word_id_idx" ON "memory_word_links"("word_id");

-- CreateIndex
CREATE UNIQUE INDEX "memory_word_links_memory_id_word_id_key" ON "memory_word_links"("memory_id", "word_id");

-- CreateIndex
CREATE INDEX "slide_decks_user_id_created_at_idx" ON "slide_decks"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "slides_reminder_id_key" ON "slides"("reminder_id");

-- CreateIndex
CREATE INDEX "slides_slide_deck_id_sort_order_idx" ON "slides"("slide_deck_id", "sort_order");

-- CreateIndex
CREATE INDEX "slides_memory_id_idx" ON "slides"("memory_id");

-- CreateIndex
CREATE UNIQUE INDEX "words_word_key" ON "words"("word");

-- AddForeignKey
ALTER TABLE "memory_word_links" ADD CONSTRAINT "memory_word_links_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_word_links" ADD CONSTRAINT "memory_word_links_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slide_decks" ADD CONSTRAINT "slide_decks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slides" ADD CONSTRAINT "slides_slide_deck_id_fkey" FOREIGN KEY ("slide_deck_id") REFERENCES "slide_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slides" ADD CONSTRAINT "slides_reminder_id_fkey" FOREIGN KEY ("reminder_id") REFERENCES "reminders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slides" ADD CONSTRAINT "slides_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
