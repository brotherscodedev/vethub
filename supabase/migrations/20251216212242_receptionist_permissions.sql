/*
  # Permissões para recepcionistas
  
  1. Permissões
    - Recepcionistas podem ver tutores da clínica
    - Recepcionistas podem criar tutores
    - Recepcionistas podem atualizar tutores
    - Recepcionistas podem ver animais da clínica
    - Recepcionistas podem criar animais
    - Recepcionistas podem atualizar animais
    - Recepcionistas podem ver consultas da clínica
    - Recepcionistas podem criar consultas
    - Recepcionistas podem atualizar consultas
    - Recepcionistas podem ver solicitações de consulta
    - Recepcionistas podem atualizar solicitações de consulta (aprovar/rejeitar)
*/

-- Tutors: Receptionists can view tutors
CREATE POLICY "Receptionists can view tutors"
  ON tutors FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM receptionists
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Tutors: Receptionists can create tutors
CREATE POLICY "Receptionists can create tutors"
  ON tutors FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM receptionists
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Tutors: Receptionists can update tutors
CREATE POLICY "Receptionists can update tutors"
  ON tutors FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM receptionists
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM receptionists
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Animals: Receptionists can view animals
CREATE POLICY "Receptionists can view animals"
  ON animals FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM receptionists
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Animals: Receptionists can create animals
CREATE POLICY "Receptionists can create animals"
  ON animals FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM receptionists
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Animals: Receptionists can update animals
CREATE POLICY "Receptionists can update animals"
  ON animals FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM receptionists
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM receptionists
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Appointments: Receptionists can view appointments
CREATE POLICY "Receptionists can view appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM receptionists
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Appointments: Receptionists can create appointments
CREATE POLICY "Receptionists can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM receptionists
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Appointments: Receptionists can update appointments
CREATE POLICY "Receptionists can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM receptionists
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM receptionists
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Appointment Requests: Receptionists can view requests
CREATE POLICY "Receptionists can view appointment requests"
  ON appointment_requests FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM receptionists
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Appointment Requests: Receptionists can update requests
CREATE POLICY "Receptionists can update appointment requests"
  ON appointment_requests FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM receptionists
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM receptionists
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Veterinarians: Receptionists can view veterinarians
CREATE POLICY "Receptionists can view veterinarians"
  ON veterinarians FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM receptionists
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );
