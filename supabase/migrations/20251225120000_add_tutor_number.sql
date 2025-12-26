-- 2025-12-25 12:00:00 - Add `number` column to tutors

BEGIN;

-- Add `number` to store the address number (ex: Rua Example, 31 -> number = '31')
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS "number" text;

COMMIT;
