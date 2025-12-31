-- CreateTable
CREATE TABLE "excluded_words" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "word" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "excluded_words_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "excluded_words_user_id_idx" ON "excluded_words"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "excluded_words_user_id_word_key" ON "excluded_words"("user_id", "word");

-- AddForeignKey
ALTER TABLE "excluded_words" ADD CONSTRAINT "excluded_words_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
