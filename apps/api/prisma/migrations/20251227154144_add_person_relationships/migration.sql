-- CreateTable
CREATE TABLE "person_relationships" (
    "id" UUID NOT NULL,
    "source_person_id" UUID NOT NULL,
    "target_person_id" UUID NOT NULL,
    "relationship_type" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "person_relationships_source_person_id_idx" ON "person_relationships"("source_person_id");

-- CreateIndex
CREATE INDEX "person_relationships_target_person_id_idx" ON "person_relationships"("target_person_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_relationships_source_person_id_target_person_id_key" ON "person_relationships"("source_person_id", "target_person_id");

-- AddForeignKey
ALTER TABLE "person_relationships" ADD CONSTRAINT "person_relationships_source_person_id_fkey" FOREIGN KEY ("source_person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_relationships" ADD CONSTRAINT "person_relationships_target_person_id_fkey" FOREIGN KEY ("target_person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;
