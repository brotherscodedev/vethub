/*
  # Schema Inicial VetHub - Sistema de Gestão Veterinária

  ## Tabelas Criadas

  ### 1. Gestão de Clínicas e Usuários
  - `clinics` - Dados das clínicas veterinárias
  - `user_profiles` - Perfis dos usuários do sistema
  - `clinic_users` - Relacionamento entre usuários e clínicas

  ### 2. Gestão de Clientes
  - `tutors` - Tutores/responsáveis pelos animais
  - `animals` - Registro dos animais

  ### 3. Gestão Clínica
  - `appointments` - Agendamentos de consultas
  - `medical_records` - Prontuários médicos
  - `prescriptions` - Prescrições médicas
  - `prescription_items` - Itens das prescrições
  - `medications` - Cadastro de medicamentos
  - `vaccinations` - Registro de vacinas

  ### 4. Gestão Financeira
  - `invoices` - Faturas/vendas
  - `invoice_items` - Itens das faturas

  ## Segurança
  - RLS (Row Level Security) habilitado em todas as tabelas
  - Políticas restritivas por padrão
  - Acesso baseado em clínica e papel do usuário
*/

-- Enums
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'veterinarian', 'receptionist', 'tutor');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'reception', 'in_progress', 'completed', 'cancelled');
CREATE TYPE prescription_status AS ENUM ('draft', 'issued', 'sent', 'viewed');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');

-- Tabela de clínicas
CREATE TABLE IF NOT EXISTS clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text UNIQUE,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  logo_url text,
  website text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  role user_role NOT NULL DEFAULT 'receptionist',
  crmv text,
  photo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Tabela de relacionamento usuário-clínica
CREATE TABLE IF NOT EXISTS clinic_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'receptionist',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, user_id)
);

ALTER TABLE clinic_users ENABLE ROW LEVEL SECURITY;

-- Tabela de tutores
CREATE TABLE IF NOT EXISTS tutors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  cpf text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  photo_url text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;

-- Tabela de animais
CREATE TABLE IF NOT EXISTS animals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  tutor_id uuid NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  name text NOT NULL,
  species text NOT NULL,
  breed text,
  weight_kg numeric(6,2),
  birth_date date,
  microchip text,
  coat_color text,
  photo_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE animals ENABLE ROW LEVEL SECURITY;

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  veterinarian_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 30,
  status appointment_status DEFAULT 'scheduled',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Tabela de prontuários médicos
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  veterinarian_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  anamnesis text,
  temperature_celsius numeric(4,2),
  heart_rate integer,
  respiratory_rate integer,
  capillary_refill_time numeric(3,1),
  weight_kg numeric(6,2),
  clinical_impression text,
  diagnosis text,
  treatment_plan text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Tabela de medicamentos
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active_ingredient text,
  manufacturer text,
  dosage_unit text NOT NULL DEFAULT 'mg',
  presentation text,
  therapeutic_class text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

-- Tabela de prescrições
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  veterinarian_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  medical_record_id uuid REFERENCES medical_records(id) ON DELETE SET NULL,
  status prescription_status DEFAULT 'draft',
  issued_at timestamptz,
  sent_at timestamptz,
  sent_to text,
  signature_url text,
  qr_code_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Tabela de itens de prescrição
CREATE TABLE IF NOT EXISTS prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE RESTRICT,
  dosage_mg numeric(10,2) NOT NULL,
  frequency text NOT NULL,
  duration_days integer,
  instructions text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;

-- Tabela de vacinas
CREATE TABLE IF NOT EXISTS vaccinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  vaccine_name text NOT NULL,
  batch_number text,
  manufacturer text,
  administered_at timestamptz NOT NULL,
  next_dose_date timestamptz,
  veterinarian_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;

-- Tabela de faturas
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  total_amount numeric(10,2) NOT NULL,
  payment_method text,
  payment_status text DEFAULT 'pending',
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Tabela de itens de fatura
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- CLINICS: Políticas básicas
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

CREATE POLICY "Authenticated users can create clinics"
  ON clinics FOR INSERT
  TO authenticated
  WITH CHECK (true);

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

-- USER_PROFILES
CREATE POLICY "Users can view profiles in their clinic"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- CLINIC_USERS
CREATE POLICY "Users can view clinic members"
  ON clinic_users FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Users can create clinic membership"
  ON clinic_users FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage clinic members"
  ON clinic_users FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

-- TUTORS
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

-- ANIMALS
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

CREATE POLICY "Tutors can view own animals"
  ON animals FOR SELECT
  TO authenticated
  USING (
    tutor_id IN (
      SELECT id FROM tutors WHERE user_id = auth.uid()
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

-- APPOINTMENTS
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

-- MEDICAL_RECORDS
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
    OR clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

-- MEDICATIONS (público para leitura)
CREATE POLICY "Everyone can view medications"
  ON medications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Veterinarians can create medications"
  ON medications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinic_users
      WHERE user_id = auth.uid()
      AND role IN ('veterinarian', 'admin')
      AND is_active = true
    )
  );

-- PRESCRIPTIONS
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
  USING (veterinarian_id = auth.uid());

-- PRESCRIPTION_ITEMS
CREATE POLICY "Users can view prescription items"
  ON prescription_items FOR SELECT
  TO authenticated
  USING (
    prescription_id IN (
      SELECT id FROM prescriptions
      WHERE clinic_id IN (
        SELECT clinic_id FROM clinic_users
        WHERE user_id = auth.uid()
        AND is_active = true
      )
    )
  );

CREATE POLICY "Veterinarians can create prescription items"
  ON prescription_items FOR INSERT
  TO authenticated
  WITH CHECK (
    prescription_id IN (
      SELECT id FROM prescriptions
      WHERE veterinarian_id = auth.uid()
    )
  );

-- VACCINATIONS
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

CREATE POLICY "Tutors can view own animals vaccinations"
  ON vaccinations FOR SELECT
  TO authenticated
  USING (
    animal_id IN (
      SELECT id FROM animals
      WHERE tutor_id IN (
        SELECT id FROM tutors WHERE user_id = auth.uid()
      )
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
      AND role IN ('veterinarian', 'admin')
      AND is_active = true
    )
  );

CREATE POLICY "Veterinarians can update vaccinations"
  ON vaccinations FOR UPDATE
  TO authenticated
  USING (
    veterinarian_id = auth.uid()
    OR clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

CREATE POLICY "Clinic staff can delete vaccinations"
  ON vaccinations FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND role IN ('veterinarian', 'admin')
      AND is_active = true
    )
  );

-- INVOICES
CREATE POLICY "Clinic staff can view invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Clinic staff can create invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Clinic staff can update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- INVOICE_ITEMS
CREATE POLICY "Users can view invoice items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE clinic_id IN (
        SELECT clinic_id FROM clinic_users
        WHERE user_id = auth.uid()
        AND is_active = true
      )
    )
  );

CREATE POLICY "Users can create invoice items"
  ON invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE user_id = auth.uid()
    )
  );

-- Índices para performance
CREATE INDEX idx_clinic_users_clinic_id ON clinic_users(clinic_id);
CREATE INDEX idx_clinic_users_user_id ON clinic_users(user_id);
CREATE INDEX idx_tutors_clinic_id ON tutors(clinic_id);
CREATE INDEX idx_animals_clinic_id ON animals(clinic_id);
CREATE INDEX idx_animals_tutor_id ON animals(tutor_id);
CREATE INDEX idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_medical_records_clinic_id ON medical_records(clinic_id);
CREATE INDEX idx_medical_records_animal_id ON medical_records(animal_id);
CREATE INDEX idx_prescriptions_clinic_id ON prescriptions(clinic_id);
CREATE INDEX idx_vaccinations_clinic_id ON vaccinations(clinic_id);
CREATE INDEX idx_vaccinations_animal_id ON vaccinations(animal_id);
CREATE INDEX idx_invoices_clinic_id ON invoices(clinic_id);
