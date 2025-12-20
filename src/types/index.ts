export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'veterinarian'
  | 'receptionist'
  | 'tutor';
export type AppointmentStatus =
  | 'pending'
  | 'scheduled'
  | 'confirmed'
  | 'reception'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
export type PrescriptionStatus = 'draft' | 'issued' | 'sent' | 'viewed';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Animal {
  id: string;
  clinic_id: string;
  tutor_id: string;
  name: string;
  species: string;
  breed?: string;
  weight_kg?: number;
  birth_date?: string;
  microchip?: string;
  coat_color?: string;
  photo_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Tutor {
  id: string;
  clinic_id: string;
  name: string;
  cpf?: string;
  email?: string;
  phone?: string;
  address?: string;
  number?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  photo_url?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  animal_id: string;
  veterinarian_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentRequest {
  id: string;
  clinic_id: string;
  tutor_id: string;
  animal_id: string;
  veterinarian_id?: string;
  requested_date: string;
  requested_time: string;
  notes?: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecord {
  id: string;
  clinic_id: string;
  animal_id: string;
  veterinarian_id: string;
  appointment_id?: string;
  anamnesis?: string;
  temperature_celsius?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  capillary_refill_time?: number;
  weight_kg?: number;
  clinical_impression?: string;
  diagnosis?: string;
  treatment_plan?: string;
  attachments?: any[];
  created_at: string;
  updated_at: string;
}

export interface MedicalRecordFile {
  id: string;
  medical_record_id?: string;
  clinic_id: string;
  animal_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size?: number;
  category?: string;
  description?: string;
  visible_to_tutor: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: string;
  name: string;
  active_ingredient?: string;
  manufacturer?: string;
  dosage_unit: string;
  presentation?: string;
  therapeutic_class?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  clinic_id: string;
  animal_id: string;
  veterinarian_id: string;
  medical_record_id?: string;
  status: PrescriptionStatus;
  issued_at?: string;
  sent_at?: string;
  sent_to?: string;
  signature_url?: string;
  qr_code_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medication_id: string;
  dosage_mg: number;
  frequency: string;
  duration_days?: number;
  instructions?: string;
  created_at: string;
}

export interface Vaccination {
  id: string;
  clinic_id: string;
  animal_id: string;
  vaccine_name: string;
  batch_number?: string;
  manufacturer?: string;
  administered_at: string;
  next_dose_date?: string;
  veterinarian_id: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  clinic_id: string;
  user_id?: string;
  tutor_id?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export interface VeterinarianSchedule {
  id: string;
  clinic_id: string;
  veterinarian_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  clinic_id: string;
  animal_id: string;
  appointment_id?: string;
  user_id: string;
  total_amount: number;
  payment_method?: string;
  payment_status: string;
  issued_at: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}
