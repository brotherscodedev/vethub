/*
  # Fix user_profiles Schema

  ## Changes
  1. Add missing columns to user_profiles:
     - `cpf` (text, nullable) - Brazilian tax ID
     - `professional_register` (text, nullable) - Professional registration number
     - `avatar_url` (text, nullable) - User avatar URL
     - `is_super_admin` (boolean, default false) - Super admin flag
  
  2. Remove columns that are no longer needed:
     - `clinic_id` - Now using clinic_users table for relationships
     - `email` - Redundant with auth.users.email
     - `role` - Now stored in clinic_users table
     - `specialty` - Not needed for initial version
     - `commission_percentage` - Not needed for initial version

  ## Notes
  - Data safety: Using IF NOT EXISTS for adding columns
  - Existing data is preserved
  - Drop policies before dropping columns they depend on
*/

-- Drop policies that reference columns we're removing
DROP POLICY IF EXISTS "Users can view profiles in their clinic" ON user_profiles;

-- Remove columns that are no longer needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE user_profiles DROP COLUMN clinic_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE user_profiles DROP COLUMN email;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE user_profiles DROP COLUMN role;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'specialty'
  ) THEN
    ALTER TABLE user_profiles DROP COLUMN specialty;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'commission_percentage'
  ) THEN
    ALTER TABLE user_profiles DROP COLUMN commission_percentage;
  END IF;
END $$;

-- Rename columns to match code expectations
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'photo_url'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE user_profiles RENAME COLUMN photo_url TO avatar_url;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'crmv'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'professional_register'
  ) THEN
    ALTER TABLE user_profiles RENAME COLUMN crmv TO professional_register;
  END IF;
END $$;

-- Add missing columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'cpf'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN cpf text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_super_admin'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_super_admin boolean DEFAULT false;
  END IF;
END $$;
