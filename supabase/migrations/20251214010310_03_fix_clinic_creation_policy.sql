/*
  # Fix Clinic Creation RLS Policy

  1. Changes
    - Update RLS policy to allow authenticated users to create clinics
    - This enables the signup flow where new users create their clinic

  2. Security
    - Only authenticated users can create clinics
    - Users can only read/update clinics they belong to
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can only see their own clinic" ON clinics;

-- Allow authenticated users to create clinics (for signup)
CREATE POLICY "Authenticated users can create clinics"
  ON clinics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can view clinics they belong to
CREATE POLICY "Users can view their clinics"
  ON clinics FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Admins can update their clinic
CREATE POLICY "Admins can update their clinic"
  ON clinics FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );
