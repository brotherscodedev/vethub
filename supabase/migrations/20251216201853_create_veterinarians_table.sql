/*
  # Create Veterinarians Table and Portal System

  ## Overview
  This migration creates a complete veterinarian management system with authentication and access control.

  ## New Tables
  1. `veterinarians`
     - `id` (uuid, primary key) - Unique identifier
     - `clinic_id` (uuid, foreign key) - Reference to clinic
     - `user_id` (uuid, foreign key, nullable) - Reference to auth.users for portal access
     - `name` (text) - Full name of veterinarian
     - `email` (text) - Email address
     - `cpf` (text) - Brazilian tax ID (used as initial password)
     - `crmv` (text) - Veterinary license number
     - `phone` (text, nullable) - Contact phone
     - `specialization` (text, nullable) - Area of expertise
     - `is_active` (boolean) - Whether the vet is currently active
     - `created_at` (timestamptz) - Record creation timestamp
     - `updated_at` (timestamptz) - Record update timestamp

  ## Table Modifications
  1. Add `veterinarian_id` to `appointments` table for tracking which vet performed the appointment
  2. Add `veterinarian_id` to `medical_records` table for tracking record author
  3. Add `veterinarian_id` to `prescriptions` table for tracking prescription author

  ## Security
  - Enable RLS on `veterinarians` table
  - Clinic admins can manage veterinarians in their clinic
  - Veterinarians can view their own profile
  - Veterinarians can view records related to their clinic

  ## Important Notes
  1. Initial password for veterinarians is their CPF
  2. Veterinarians can change their password after first login
  3. Veterinarians have read access to medical data in their clinic
*/

-- Create veterinarians table
CREATE TABLE IF NOT EXISTS veterinarians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  cpf text NOT NULL,
  crmv text NOT NULL,
  phone text,
  specialization text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, email),
  UNIQUE(clinic_id, cpf),
  UNIQUE(crmv)
);

-- Add veterinarian_id to appointments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'veterinarian_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN veterinarian_id uuid REFERENCES veterinarians(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add veterinarian_id to medical_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_records' AND column_name = 'veterinarian_id'
  ) THEN
    ALTER TABLE medical_records ADD COLUMN veterinarian_id uuid REFERENCES veterinarians(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add veterinarian_id to prescriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prescriptions' AND column_name = 'veterinarian_id'
  ) THEN
    ALTER TABLE prescriptions ADD COLUMN veterinarian_id uuid REFERENCES veterinarians(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE veterinarians ENABLE ROW LEVEL SECURITY;

-- Clinic admins can view veterinarians in their clinic
CREATE POLICY "Clinic admins can view clinic veterinarians"
  ON veterinarians FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Clinic admins can insert veterinarians
CREATE POLICY "Clinic admins can create veterinarians"
  ON veterinarians FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Clinic admins can update veterinarians in their clinic
CREATE POLICY "Clinic admins can update clinic veterinarians"
  ON veterinarians FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Veterinarians can view their own profile
CREATE POLICY "Veterinarians can view own profile"
  ON veterinarians FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Veterinarians can update their own profile
CREATE POLICY "Veterinarians can update own profile"
  ON veterinarians FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_veterinarians_clinic_id ON veterinarians(clinic_id);
CREATE INDEX IF NOT EXISTS idx_veterinarians_user_id ON veterinarians(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_veterinarian_id ON appointments(veterinarian_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_veterinarian_id ON medical_records(veterinarian_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_veterinarian_id ON prescriptions(veterinarian_id);

-- Update RLS policies for veterinarians to access medical data

-- Veterinarians can view animals in their clinic
CREATE POLICY "Veterinarians can view clinic animals"
  ON animals FOR SELECT
  TO authenticated
  USING (
    tutor_id IN (
      SELECT t.id FROM tutors t
      WHERE t.clinic_id IN (
        SELECT clinic_id FROM veterinarians 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Veterinarians can view appointments in their clinic
CREATE POLICY "Veterinarians can view clinic appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    animal_id IN (
      SELECT a.id FROM animals a
      JOIN tutors t ON a.tutor_id = t.id
      WHERE t.clinic_id IN (
        SELECT clinic_id FROM veterinarians 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Veterinarians can view medical records in their clinic
CREATE POLICY "Veterinarians can view clinic medical records"
  ON medical_records FOR SELECT
  TO authenticated
  USING (
    animal_id IN (
      SELECT a.id FROM animals a
      JOIN tutors t ON a.tutor_id = t.id
      WHERE t.clinic_id IN (
        SELECT clinic_id FROM veterinarians 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Veterinarians can view prescriptions in their clinic
CREATE POLICY "Veterinarians can view clinic prescriptions"
  ON prescriptions FOR SELECT
  TO authenticated
  USING (
    animal_id IN (
      SELECT a.id FROM animals a
      JOIN tutors t ON a.tutor_id = t.id
      WHERE t.clinic_id IN (
        SELECT clinic_id FROM veterinarians 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Veterinarians can view vaccinations in their clinic
CREATE POLICY "Veterinarians can view clinic vaccinations"
  ON vaccinations FOR SELECT
  TO authenticated
  USING (
    animal_id IN (
      SELECT a.id FROM animals a
      JOIN tutors t ON a.tutor_id = t.id
      WHERE t.clinic_id IN (
        SELECT clinic_id FROM veterinarians 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Veterinarians can view tutors in their clinic
CREATE POLICY "Veterinarians can view clinic tutors"
  ON tutors FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM veterinarians 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
