-- CreateTable: images
CREATE TABLE "images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "storage_url" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "thumbnail_url_256" TEXT,
    "thumbnail_url_1024" TEXT,
    "content_type" VARCHAR(50) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "phash" VARCHAR(64),
    "width" INTEGER,
    "height" INTEGER,
    "exif_data" JSONB,
    "captured_at" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "location_accuracy" DOUBLE PRECISION,
    "location_source" VARCHAR(20),
    "consent_biometrics" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable: image_faces
CREATE TABLE "image_faces" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "image_id" UUID NOT NULL,
    "bbox_x" INTEGER NOT NULL,
    "bbox_y" INTEGER NOT NULL,
    "bbox_width" INTEGER NOT NULL,
    "bbox_height" INTEGER NOT NULL,
    "blur_score" DOUBLE PRECISION,
    "occlusion_score" DOUBLE PRECISION,
    "pose_yaw" DOUBLE PRECISION,
    "pose_pitch" DOUBLE PRECISION,
    "pose_roll" DOUBLE PRECISION,
    "embedding" JSONB,
    "embedding_model" VARCHAR(50),
    "face_crop_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_faces_pkey" PRIMARY KEY ("id")
);

-- CreateTable: image_person_links
CREATE TABLE "image_person_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "image_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "face_id" UUID,
    "confidence" DOUBLE PRECISION,
    "link_method" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_person_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable: memory_image_links
CREATE TABLE "memory_image_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "memory_id" UUID NOT NULL,
    "image_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_image_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "images_user_id_idx" ON "images"("user_id");
CREATE INDEX "images_sha256_idx" ON "images"("sha256");
CREATE INDEX "images_phash_idx" ON "images"("phash");
CREATE UNIQUE INDEX "images_user_id_sha256_key" ON "images"("user_id", "sha256");

CREATE INDEX "image_faces_image_id_idx" ON "image_faces"("image_id");

CREATE INDEX "image_person_links_image_id_idx" ON "image_person_links"("image_id");
CREATE INDEX "image_person_links_person_id_idx" ON "image_person_links"("person_id");
CREATE INDEX "image_person_links_face_id_idx" ON "image_person_links"("face_id");
CREATE UNIQUE INDEX "image_person_links_image_id_person_id_face_id_key" ON "image_person_links"("image_id", "person_id", "face_id");

CREATE INDEX "memory_image_links_memory_id_idx" ON "memory_image_links"("memory_id");
CREATE INDEX "memory_image_links_image_id_idx" ON "memory_image_links"("image_id");
CREATE UNIQUE INDEX "memory_image_links_memory_id_image_id_key" ON "memory_image_links"("memory_id", "image_id");

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "image_faces" ADD CONSTRAINT "image_faces_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "image_person_links" ADD CONSTRAINT "image_person_links_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "image_person_links" ADD CONSTRAINT "image_person_links_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "image_person_links" ADD CONSTRAINT "image_person_links_face_id_fkey" FOREIGN KEY ("face_id") REFERENCES "image_faces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "memory_image_links" ADD CONSTRAINT "memory_image_links_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memory_image_links" ADD CONSTRAINT "memory_image_links_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;
