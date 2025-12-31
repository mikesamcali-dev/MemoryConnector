-- AlterTable
ALTER TABLE "youtube_videos" ADD COLUMN     "caption_available" BOOLEAN,
ADD COLUMN     "captured_at" TIMESTAMP(3),
ADD COLUMN     "comment_count" BIGINT,
ADD COLUMN     "favorite_count" BIGINT,
ADD COLUMN     "license" VARCHAR(64),
ADD COLUMN     "made_for_kids" BOOLEAN;
