/*
  # Fix Infinite Recursion in clinic_users Policies

  ## Problem
  The clinic_users table had policies that referenced itself, causing infinite recursion.
  
  ## Solution
  Simplify policies to avoid self-referencing:
  - Users can view their own clinic relationships directly
  - Users can create their own relationships (for signup)
  - Admins need special handling to avoid recursion
  
  ## Changes
  1. Drop all existing problematic policies on clinic_users
  2. Create simplified, non-recursive policies
  3. Fix policies in other tables that depend on clinic_users
*/

-- ============================================
-- FIX CLINIC_USERS POLICIES (Remove recursion)
-- ============================================

DROP POLICY IF EXISTS "Users can view clinic members" ON clinic_users;
DROP POLICY IF EXISTS "Users can create clinic membership" ON clinic_users;
DROP POLICY IF EXISTS "Admins can manage clinic members" ON clinic_users;
DROP POLICY IF EXISTS "Users can view own clinic relationships" ON clinic_users;
DROP POLICY IF EXISTS "Users can create clinic relationships" ON clinic_users;

-- Simple policy: users can view their own relationships
CREATE POLICY "Users can view own relationships"
  ON clinic_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own clinic relationships (needed for signup)
CREATE POLICY "Users can insert own relationships"
  ON clinic_users FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- For updates and deletes, we need a different approach
-- Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION is_clinic_admin(check_clinic_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM clinic_users
    WHERE clinic_users.clinic_id = check_clinic_id
    AND clinic_users.user_id = auth.uid()
    AND clinic_users.role = 'admin'
    AND clinic_users.is_active = true
  );
$$;

-- Users can update their own relationship or admins can update in their clinic
CREATE POLICY "Users can update relationships"
  ON clinic_users FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_clinic_admin(clinic_id)
  );

-- Only admins can delete relationships in their clinic
CREATE POLICY "Admins can delete relationships"
  ON clinic_users FOR DELETE
  TO authenticated
  USING (is_clinic_admin(clinic_id));

-- ============================================
-- FIX OTHER TABLES TO USE HELPER FUNCTION
-- ============================================

-- Update clinics policies to use helper function
DROP POLICY IF EXISTS "Admins can update their clinic" ON clinics;

CREATE POLICY "Admins can update their clinic"
  ON clinics FOR UPDATE
  TO authenticated
  USING (is_clinic_admin(id));

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION is_clinic_admin TO authenticated;
