-- AlterTable
ALTER TABLE "audit_trail" ADD COLUMN     "method" VARCHAR(10),
ADD COLUMN     "msg" TEXT,
ADD COLUMN     "url" VARCHAR(500);
