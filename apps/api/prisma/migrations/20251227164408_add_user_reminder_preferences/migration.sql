-- CreateTable
CREATE TABLE "user_reminder_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "first_reminder_minutes" INTEGER NOT NULL DEFAULT 3,
    "second_reminder_minutes" INTEGER NOT NULL DEFAULT 4320,
    "third_reminder_minutes" INTEGER NOT NULL DEFAULT 30240,
    "reminders_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_reminder_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_reminder_preferences_user_id_key" ON "user_reminder_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "user_reminder_preferences" ADD CONSTRAINT "user_reminder_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
