-- CreateEnum
CREATE TYPE "SpeechSessionStatus" AS ENUM ('active', 'processing', 'completed', 'failed', 'expired');

-- AlterTable
ALTER TABLE "user_usage" ADD COLUMN     "voice_minutes_this_month" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "speech_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "sessionKey" VARCHAR(100) NOT NULL,
    "status" "SpeechSessionStatus" NOT NULL DEFAULT 'active',
    "audioFormat" VARCHAR(50),
    "duration_ms" INTEGER,
    "chunk_count" INTEGER NOT NULL DEFAULT 0,
    "partial_transcript" TEXT,
    "final_transcript" TEXT,
    "processing_started_at" TIMESTAMP(3),
    "processing_ended_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "speech_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speech_chunks" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transcribed_at" TIMESTAMP(3),
    "transcript_text" TEXT,

    CONSTRAINT "speech_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_lexicon" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "term" VARCHAR(200) NOT NULL,
    "replacement" VARCHAR(200),
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_lexicon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcript_feedback" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_id" UUID,
    "raw_transcript" TEXT NOT NULL,
    "corrected_text" TEXT NOT NULL,
    "corrections" JSONB NOT NULL,
    "consent_store" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transcript_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "speech_sessions_sessionKey_key" ON "speech_sessions"("sessionKey");

-- CreateIndex
CREATE INDEX "speech_sessions_user_id_created_at_idx" ON "speech_sessions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "speech_sessions_sessionKey_idx" ON "speech_sessions"("sessionKey");

-- CreateIndex
CREATE INDEX "speech_sessions_expires_at_idx" ON "speech_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "speech_chunks_session_id_chunk_index_idx" ON "speech_chunks"("session_id", "chunk_index");

-- CreateIndex
CREATE UNIQUE INDEX "speech_chunks_session_id_chunk_index_key" ON "speech_chunks"("session_id", "chunk_index");

-- CreateIndex
CREATE INDEX "user_lexicon_user_id_idx" ON "user_lexicon"("user_id");

-- CreateIndex
CREATE INDEX "user_lexicon_user_id_usage_count_idx" ON "user_lexicon"("user_id", "usage_count" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_lexicon_user_id_term_key" ON "user_lexicon"("user_id", "term");

-- CreateIndex
CREATE INDEX "transcript_feedback_user_id_created_at_idx" ON "transcript_feedback"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "transcript_feedback_session_id_idx" ON "transcript_feedback"("session_id");

-- AddForeignKey
ALTER TABLE "speech_sessions" ADD CONSTRAINT "speech_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speech_chunks" ADD CONSTRAINT "speech_chunks_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "speech_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lexicon" ADD CONSTRAINT "user_lexicon_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcript_feedback" ADD CONSTRAINT "transcript_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
