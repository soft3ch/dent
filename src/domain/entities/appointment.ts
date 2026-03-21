import { Patient } from './patient';
import { Treatment } from './treatment';

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Appointment {
  id: string;
  patient_id: string;
  treatment_id: string | null;
  start_time: string;
  end_time: string | null;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  
  // Relations mapped via Supabase joins
  patient?: Patient;
  treatment?: Treatment;
}
