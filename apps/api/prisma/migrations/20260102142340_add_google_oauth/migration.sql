-- AlterTable
ALTER TABLE "users"
  ALTER COLUMN "password_hash" DROP NOT NULL,
  ADD COLUMN "google_id" TEXT,
  ADD COLUMN "provider" TEXT DEFAULT 'local';

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
