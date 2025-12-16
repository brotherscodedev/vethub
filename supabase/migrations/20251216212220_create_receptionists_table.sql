/*
  # Criar tabela de recepcionistas
  
  1. Nova Tabela
    - `receptionists` - Recepcionistas das clínicas
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, referência para clinics)
      - `user_id` (uuid, referência para auth.users)
      - `name` (text)
      - `email` (text, único)
      - `cpf` (text, único)
      - `phone` (text)
      - `is_active` (boolean, padrão true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Segurança
    - Enable RLS na tabela receptionists
    - Clinic staff pode ver recepcionistas
    - Clinic staff pode criar recepcionistas
    - Clinic staff pode atualizar recepcionistas
    - Recepcionistas podem ver próprio perfil
    - Recepcionistas podem atualizar próprio perfil
*/

-- Criar tabela de recepcionistas
CREATE TABLE IF NOT EXISTS receptionists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  cpf text UNIQUE NOT NULL,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE receptionists ENABLE ROW LEVEL SECURITY;

-- Clinic staff can view receptionists
CREATE POLICY "Clinic staff can view receptionists"
  ON receptionists FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Clinic staff can create receptionists
CREATE POLICY "Clinic staff can create receptionists"
  ON receptionists FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Clinic staff can update receptionists
CREATE POLICY "Clinic staff can update receptionists"
  ON receptionists FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Receptionists can view own profile
CREATE POLICY "Receptionists can view own profile"
  ON receptionists FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Receptionists can update own profile
CREATE POLICY "Receptionists can update own profile"
  ON receptionists FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Clinic staff can delete receptionists
CREATE POLICY "Clinic staff can delete receptionists"
  ON receptionists FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_receptionists_clinic_id ON receptionists(clinic_id);
CREATE INDEX IF NOT EXISTS idx_receptionists_user_id ON receptionists(user_id);
CREATE INDEX IF NOT EXISTS idx_receptionists_email ON receptionists(email);
CREATE INDEX IF NOT EXISTS idx_receptionists_cpf ON receptionists(cpf);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_receptionists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER receptionists_updated_at
  BEFORE UPDATE ON receptionists
  FOR EACH ROW
  EXECUTE FUNCTION update_receptionists_updated_at();
