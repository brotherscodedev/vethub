/*
  # Funcionalidades Avançadas - VetHub

  1. Novas Tabelas
    - `appointment_requests`: Solicitações de agendamento do portal do tutor
    - `medical_record_files`: Arquivos e imagens dos prontuários
    - `notifications`: Sistema de notificações
    - `veterinarian_schedules`: Horários dos veterinários

  2. Alterações nas Tabelas Existentes
    - Adicionar campos de comissão e especialidade em user_profiles
    - Adicionar "pending" ao enum appointment_status

  3. Segurança
    - RLS em todas as novas tabelas
    - Controle de visibilidade de arquivos médicos
*/

-- Adicionar "pending" ao enum appointment_status se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'pending' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'appointment_status')
  ) THEN
    ALTER TYPE appointment_status ADD VALUE 'pending' BEFORE 'scheduled';
  END IF;
END $$;

-- Adicionar campos aos user_profiles para veterinários
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'specialty') THEN
    ALTER TABLE user_profiles ADD COLUMN specialty text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'commission_percentage') THEN
    ALTER TABLE user_profiles ADD COLUMN commission_percentage numeric(5,2) DEFAULT 0;
  END IF;
END $$;

-- Tabela de solicitações de agendamento (do portal do tutor)
CREATE TABLE IF NOT EXISTS appointment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  tutor_id uuid NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  veterinarian_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_date date NOT NULL,
  requested_time time NOT NULL,
  notes text,
  status text DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic staff can view appointment requests"
  ON appointment_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinic_users
      WHERE clinic_users.user_id = auth.uid()
      AND clinic_users.clinic_id = appointment_requests.clinic_id
      AND clinic_users.is_active = true
    )
  );

CREATE POLICY "Tutors can view own requests"
  ON appointment_requests FOR SELECT
  USING (
    tutor_id IN (
      SELECT id FROM tutors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can create requests"
  ON appointment_requests FOR INSERT
  WITH CHECK (
    tutor_id IN (
      SELECT id FROM tutors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clinic staff can update requests"
  ON appointment_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clinic_users
      WHERE clinic_users.user_id = auth.uid()
      AND clinic_users.clinic_id = appointment_requests.clinic_id
      AND clinic_users.role IN ('admin', 'receptionist')
      AND clinic_users.is_active = true
    )
  );

-- Tabela de arquivos médicos (imagens, exames, etc)
CREATE TABLE IF NOT EXISTS medical_record_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id uuid REFERENCES medical_records(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  category text,
  description text,
  visible_to_tutor boolean DEFAULT false,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE medical_record_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic staff can view medical files"
  ON medical_record_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinic_users
      WHERE clinic_users.user_id = auth.uid()
      AND clinic_users.clinic_id = medical_record_files.clinic_id
      AND clinic_users.is_active = true
    )
  );

CREATE POLICY "Tutors can view visible files"
  ON medical_record_files FOR SELECT
  USING (
    visible_to_tutor = true
    AND animal_id IN (
      SELECT id FROM animals WHERE tutor_id IN (
        SELECT id FROM tutors WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Veterinarians can upload files"
  ON medical_record_files FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM clinic_users
      WHERE clinic_users.user_id = auth.uid()
      AND clinic_users.clinic_id = medical_record_files.clinic_id
      AND clinic_users.role IN ('veterinarian', 'admin')
      AND clinic_users.is_active = true
    )
  );

CREATE POLICY "Veterinarians can update files"
  ON medical_record_files FOR UPDATE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM clinic_users
      WHERE clinic_users.user_id = auth.uid()
      AND clinic_users.clinic_id = medical_record_files.clinic_id
      AND clinic_users.role = 'admin'
      AND clinic_users.is_active = true
    )
  );

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (
    user_id = auth.uid()
    OR tutor_id IN (
      SELECT id FROM tutors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (
    user_id = auth.uid()
    OR tutor_id IN (
      SELECT id FROM tutors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clinic staff can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinic_users
      WHERE clinic_users.user_id = auth.uid()
      AND clinic_users.clinic_id = notifications.clinic_id
      AND clinic_users.is_active = true
    )
  );

-- Tabela de configurações de horários dos veterinários
CREATE TABLE IF NOT EXISTS veterinarian_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  veterinarian_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(veterinarian_id, day_of_week)
);

ALTER TABLE veterinarian_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic staff can view schedules"
  ON veterinarian_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinic_users
      WHERE clinic_users.user_id = auth.uid()
      AND clinic_users.clinic_id = veterinarian_schedules.clinic_id
      AND clinic_users.is_active = true
    )
  );

CREATE POLICY "Veterinarians can view own schedule"
  ON veterinarian_schedules FOR SELECT
  USING (veterinarian_id = auth.uid());

CREATE POLICY "Admins can manage schedules"
  ON veterinarian_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clinic_users
      WHERE clinic_users.user_id = auth.uid()
      AND clinic_users.clinic_id = veterinarian_schedules.clinic_id
      AND clinic_users.role = 'admin'
      AND clinic_users.is_active = true
    )
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_appointment_requests_clinic_id ON appointment_requests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_status ON appointment_requests(status);
CREATE INDEX IF NOT EXISTS idx_medical_record_files_animal_id ON medical_record_files(animal_id);
CREATE INDEX IF NOT EXISTS idx_medical_record_files_visible ON medical_record_files(visible_to_tutor);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_veterinarian_schedules_vet_id ON veterinarian_schedules(veterinarian_id);
