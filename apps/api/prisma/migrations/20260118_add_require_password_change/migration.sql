-- Add requirePasswordChange field to users table
ALTER TABLE "users" ADD COLUMN "require_password_change" BOOLEAN NOT NULL DEFAULT false;

-- Add comment explaining the field
COMMENT ON COLUMN "users"."require_password_change" IS 'Flag indicating if user must change password on next login';
