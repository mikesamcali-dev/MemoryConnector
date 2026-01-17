-- CreateEnum for Learning Style
CREATE TYPE "LearningStyle" AS ENUM ('VISUAL', 'HANDS_ON', 'THEORETICAL', 'MIXED');

-- CreateEnum for Skill Level
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum for Primary Goal
CREATE TYPE "PrimaryGoal" AS ENUM ('RETENTION', 'LEARNING', 'ORGANIZATION', 'HABIT_BUILDING');

-- CreateEnum for Preferred Pace
CREATE TYPE "PreferredPace" AS ENUM ('INTENSIVE', 'MODERATE', 'GRADUAL');

-- CreateEnum for Trigger Type
CREATE TYPE "TriggerType" AS ENUM ('TIME', 'LOCATION', 'ROUTINE', 'CONTEXT');

-- CreateEnum for Frequency
CREATE TYPE "Frequency" AS ENUM ('DAILY', 'WEEKDAYS', 'WEEKENDS', 'CUSTOM');

-- CreateEnum for CheckIn Type
CREATE TYPE "CheckInType" AS ENUM ('WEEKLY', 'MONTHLY', 'TRIGGERED');

-- CreateTable user_memory_profiles
CREATE TABLE "user_memory_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "learning_style" "LearningStyle" NOT NULL,
    "skill_level" "SkillLevel" NOT NULL,
    "primary_goal" "PrimaryGoal" NOT NULL,
    "preferred_pace" "PreferredPace" NOT NULL,
    "daily_time_commitment" INTEGER NOT NULL,
    "areas_of_interest" TEXT[] NOT NULL,
    "cognitive_preferences" JSONB,
    "average_recall_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "average_review_time" INTEGER NOT NULL DEFAULT 0,
    "optimal_review_interval" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "preferred_review_time" VARCHAR(20),
    "last_adaptation_update" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "peak_activity_hours" INTEGER[] NOT NULL,
    "consecutive_missed_days" INTEGER NOT NULL DEFAULT 0,
    "total_check_ins" INTEGER NOT NULL DEFAULT 0,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "last_check_in_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_memory_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable implementation_intentions
CREATE TABLE "implementation_intentions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "trigger_type" "TriggerType" NOT NULL,
    "trigger_value" VARCHAR(255) NOT NULL,
    "action" VARCHAR(500) NOT NULL,
    "if_then_phrase" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" "Frequency" NOT NULL DEFAULT 'DAILY',
    "custom_days" INTEGER[] NOT NULL,
    "completion_count" INTEGER NOT NULL DEFAULT 0,
    "missed_count" INTEGER NOT NULL DEFAULT 0,
    "last_triggered_at" TIMESTAMP(3),
    "last_completed_at" TIMESTAMP(3),
    "first_reminder_minutes" INTEGER NOT NULL DEFAULT 0,
    "second_reminder_minutes" INTEGER NOT NULL DEFAULT 120,
    "third_reminder_minutes" INTEGER NOT NULL DEFAULT 1440,
    "is_paused" BOOLEAN NOT NULL DEFAULT false,
    "paused_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "implementation_intentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable adaptive_review_configs
CREATE TABLE "adaptive_review_configs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "initial_interval" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "ease_factor_default" DOUBLE PRECISION NOT NULL DEFAULT 2.3,
    "max_interval" INTEGER NOT NULL DEFAULT 30,
    "min_ease_factor" DOUBLE PRECISION NOT NULL DEFAULT 1.3,
    "interval_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "difficulty_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "max_reviews_per_session" INTEGER NOT NULL DEFAULT 20,
    "prefer_recognition" BOOLEAN NOT NULL DEFAULT false,
    "show_context" BOOLEAN NOT NULL DEFAULT true,
    "enable_haptic_feedback" BOOLEAN NOT NULL DEFAULT true,
    "adaptive_scheduling" BOOLEAN NOT NULL DEFAULT true,
    "forgiveness_factor" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adaptive_review_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable daily_check_ins
CREATE TABLE "daily_check_ins" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "check_in_date" DATE NOT NULL,
    "reviews_due" INTEGER NOT NULL DEFAULT 0,
    "reviews_completed" INTEGER NOT NULL DEFAULT 0,
    "intentions_triggered" INTEGER NOT NULL DEFAULT 0,
    "intentions_completed" INTEGER NOT NULL DEFAULT 0,
    "confidence_level" INTEGER,
    "difficulty_level" INTEGER,
    "time_spent_minutes" INTEGER,
    "suggested_adjustment" VARCHAR(100),
    "user_acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable profile_check_ins
CREATE TABLE "profile_check_ins" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "check_in_type" "CheckInType" NOT NULL,
    "trigger_reason" VARCHAR(255),
    "questions" JSONB NOT NULL,
    "profile_updates_before" JSONB NOT NULL,
    "profile_updates_after" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_memory_profiles_user_id_key" ON "user_memory_profiles"("user_id");

-- CreateIndex
CREATE INDEX "user_memory_profiles_user_id_idx" ON "user_memory_profiles"("user_id");

-- CreateIndex
CREATE INDEX "user_memory_profiles_user_id_onboarding_completed_idx" ON "user_memory_profiles"("user_id", "onboarding_completed");

-- CreateIndex
CREATE INDEX "implementation_intentions_user_id_enabled_idx" ON "implementation_intentions"("user_id", "enabled");

-- CreateIndex
CREATE INDEX "implementation_intentions_user_id_trigger_type_idx" ON "implementation_intentions"("user_id", "trigger_type");

-- CreateIndex
CREATE INDEX "implementation_intentions_last_triggered_at_idx" ON "implementation_intentions"("last_triggered_at");

-- CreateIndex
CREATE UNIQUE INDEX "adaptive_review_configs_user_id_key" ON "adaptive_review_configs"("user_id");

-- CreateIndex
CREATE INDEX "adaptive_review_configs_user_id_idx" ON "adaptive_review_configs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_check_ins_user_id_check_in_date_key" ON "daily_check_ins"("user_id", "check_in_date");

-- CreateIndex
CREATE INDEX "daily_check_ins_user_id_idx" ON "daily_check_ins"("user_id");

-- CreateIndex
CREATE INDEX "daily_check_ins_check_in_date_idx" ON "daily_check_ins"("check_in_date");

-- CreateIndex
CREATE INDEX "profile_check_ins_user_id_idx" ON "profile_check_ins"("user_id");

-- CreateIndex
CREATE INDEX "profile_check_ins_check_in_type_idx" ON "profile_check_ins"("check_in_type");

-- CreateIndex
CREATE INDEX "profile_check_ins_user_id_created_at_idx" ON "profile_check_ins"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "user_memory_profiles" ADD CONSTRAINT "user_memory_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_intentions" ADD CONSTRAINT "implementation_intentions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adaptive_review_configs" ADD CONSTRAINT "adaptive_review_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_check_ins" ADD CONSTRAINT "daily_check_ins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_check_ins" ADD CONSTRAINT "profile_check_ins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
