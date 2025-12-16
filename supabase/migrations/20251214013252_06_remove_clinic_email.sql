/*
  # Remove email column from clinics table

  ## Changes
  1. Drop the email column from clinics table as it's not needed
*/

ALTER TABLE clinics DROP COLUMN IF EXISTS email;
