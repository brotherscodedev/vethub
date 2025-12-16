/*
  # Complete RLS Policies for All Core Tables

  ## Overview
  This migration adds comprehensive RLS policies to all core tables to enable:
  - User signup and profile creation
  - Clinic creation during registration
  - CRUD operations on tutors and animals
  - Appointment management
  - Medical records access

  ## Tables Updated
  1. **user_profiles**: Allow users to create and update their own profiles
  2. **clinic_users**: Allow creation of clinic-user relationships during signup
  3. **tutors**: Full CRUD for clinic staff
  4. **animals**: Full CRUD for clinic staff
  5. **appointments**: Full CRUD for clinic staff
  6. **medical_records**: Full CRUD for veterinarians
  7. **prescriptions**: Full CRUD for veterinarians
  8. **vaccinations**: Full CRUD for veterinarians

  ## Security Principles
  - Users can only access data from their own clinic(s)
  - Tutors can only see their own animals and appointments
  - Only authenticated users can perform operations
  - Role-based access control for sensitive operations
*/

-- ====================
-- USER_PROFILES POLICIES
-- ====================

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ====================
-- CLINIC_USERS POLICIES
-- ====================

DROP POLICY IF EXISTS "Users can view own clinic relationships" ON clinic_users;
DROP POLICY IF EXISTS "Users can create clinic relationships" ON clinic_users;
DROP POLICY IF EXISTS "Admins can manage clinic users" ON clinic_users;

CREATE POLICY "Users can view own clinic relationships"
  ON clinic_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create clinic relationships"
  ON clinic_users FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage clinic users"
  ON clinic_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinic_users AS cu
      WHERE cu.user_id = auth.uid()
      AND cu.clinic_id = clinic_users.clinic_id
      AND cu.role = 'admin'
      AND cu.is_active = true
    )
  );

-- ====================
-- TUTORS POLICIES
-- ====================

DROP POLICY IF EXISTS "Clinic staff can view tutors" ON tutors;
DROP POLICY IF EXISTS "Clinic staff can create tutors" ON tutors;
DROP POLICY IF EXISTS "Clinic staff can update tutors" ON tutors;
DROP POLICY IF EXISTS "Clinic staff can delete tutors" ON tutors;
DROP POLICY IF EXISTS "Tutors can view own data" ON tutors;

CREATE POLICY "Clinic staff can view tutors"
  ON tutors FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Clinic staff can create tutors"
  ON tutors FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Clinic staff can update tutors"
  ON tutors FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Clinic staff can delete tutors"
  ON tutors FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'receptionist')
      AND is_active = true
    )
  );

CREATE POLICY "Tutors can view own data"
  ON tutors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ====================
-- ANIMALS POLICIES
-- ====================

DROP POLICY IF EXISTS "Clinic staff can view animals" ON animals;
DROP POLICY IF EXISTS "Clinic staff can create animals" ON animals;
DROP POLICY IF EXISTS "Clinic staff can update animals" ON animals;
DROP POLICY IF EXISTS "Clinic staff can delete animals" ON animals;
DROP POLICY IF EXISTS "Tutors can view own animals" ON animals;

CREATE POLICY "Clinic staff can view animals"
  ON animals FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Clinic staff can create animals"
  ON animals FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Clinic staff can update animals"
  ON animals FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Clinic staff can delete animals"
  ON animals FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'receptionist')
      AND is_active = true
    )
  );

CREATE POLICY "Tutors can view own animals"
  ON animals FOR SELECT
  TO authenticated
  USING (
    tutor_id IN (
      SELECT id FROM tutors WHERE user_id = auth.uid()
    )
  );

-- ====================
-- APPOINTMENTS POLICIES
-- ====================

DROP POLICY IF EXISTS "Clinic staff can view appointments" ON appointments;
DROP POLICY IF EXISTS "Clinic staff can create appointments" ON appointments;
DROP POLICY IF EXISTS "Clinic staff can update appointments" ON appointments;
DROP POLICY IF EXISTS "Clinic staff can delete appointments" ON appointments;

CREATE POLICY "Clinic staff can view appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Clinic staff can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Clinic staff can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Clinic staff can delete appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'receptionist')
      AND is_active = true
    )
  );

-- ====================
-- MEDICAL_RECORDS POLICIES
-- ====================

DROP POLICY IF EXISTS "Clinic staff can view medical records" ON medical_records;
DROP POLICY IF EXISTS "Veterinarians can create medical records" ON medical_records;
DROP POLICY IF EXISTS "Veterinarians can update own medical records" ON medical_records;

CREATE POLICY "Clinic staff can view medical records"
  ON medical_records FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Veterinarians can create medical records"
  ON medical_records FOR INSERT
  TO authenticated
  WITH CHECK (
    veterinarian_id = auth.uid()
    AND clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND role IN ('veterinarian', 'admin')
      AND is_active = true
    )
  );

CREATE POLICY "Veterinarians can update own medical records"
  ON medical_records FOR UPDATE
  TO authenticated
  USING (
    veterinarian_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM clinic_users
      WHERE user_id = auth.uid()
      AND clinic_id = medical_records.clinic_id
      AND role = 'admin'
      AND is_active = true
    )
  );

-- ====================
-- PRESCRIPTIONS POLICIES
-- ====================

DROP POLICY IF EXISTS "Clinic staff can view prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Veterinarians can create prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Veterinarians can update own prescriptions" ON prescriptions;

CREATE POLICY "Clinic staff can view prescriptions"
  ON prescriptions FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Veterinarians can create prescriptions"
  ON prescriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    veterinarian_id = auth.uid()
    AND clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND role IN ('veterinarian', 'admin')
      AND is_active = true
    )
  );

CREATE POLICY "Veterinarians can update own prescriptions"
  ON prescriptions FOR UPDATE
  TO authenticated
  USING (
    veterinarian_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM clinic_users
      WHERE user_id = auth.uid()
      AND clinic_id = prescriptions.clinic_id
      AND role = 'admin'
      AND is_active = true
    )
  );

-- ====================
-- VACCINATIONS POLICIES
-- ====================

DROP POLICY IF EXISTS "Clinic staff can view vaccinations" ON vaccinations;
DROP POLICY IF EXISTS "Veterinarians can create vaccinations" ON vaccinations;
DROP POLICY IF EXISTS "Veterinarians can update vaccinations" ON vaccinations;

CREATE POLICY "Clinic staff can view vaccinations"
  ON vaccinations FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Veterinarians can create vaccinations"
  ON vaccinations FOR INSERT
  TO authenticated
  WITH CHECK (
    veterinarian_id = auth.uid()
    AND clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND role IN ('veterinarian', 'admin', 'receptionist')
      AND is_active = true
    )
  );

CREATE POLICY "Veterinarians can update vaccinations"
  ON vaccinations FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND role IN ('veterinarian', 'admin')
      AND is_active = true
    )
  );
