'use server';
import { supabase } from '@/infrastructure/supabase/client';

export async function getPatientsList(searchQuery?: string) {
  let query = supabase
    .from('patients')
    .select(`
      id,
      full_name,
      dni,
      phone,
      email,
      created_at,
      appointments (
        payment_method,
        start_time
      )
    `)
    .order('created_at', { ascending: false });

  if (searchQuery) {
    query = query.or(`full_name.ilike.%${searchQuery}%,dni.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error('Error fetching patients: ' + error.message);

  // Mapear el método de pago más reciente
  return data.map(patient => {
    let recentPaymentMethod = 'Sin citas';
    if (patient.appointments && patient.appointments.length > 0) {
      // Sort appointments to get the most recent one
      const sorted = [...patient.appointments].sort((a: any, b: any) => 
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );
      const method = sorted[0].payment_method;
      recentPaymentMethod = method === 'obra_social' ? 'Obra Social' : 'Particular';
    }
    
    return {
      ...patient,
      recent_payment_method: recentPaymentMethod,
      appointments_count: patient.appointments?.length || 0
    };
  });
}

export async function getPatientDetails(patientId: string) {
  const { data: patient, error: pError } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .single();

  if (pError) throw new Error('Error fetching patient: ' + pError.message);

  const { data: appointments, error: aError } = await supabase
    .from('appointments')
    .select(`
      *,
      treatment:treatments(*),
      clinical_notes(*)
    `)
    .eq('patient_id', patientId)
    .order('start_time', { ascending: false });

  if (aError) throw new Error('Error fetching appointments: ' + aError.message);

  const { data: patientTreatments, error: ptError } = await supabase
    .from('patient_treatments')
    .select(`
      *,
      treatment:treatments(*)
    `)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (ptError) throw new Error('Error fetching patient treatments: ' + ptError.message);

  return { 
    patient, 
    appointments: appointments || [], 
    patientTreatments: patientTreatments || [] 
  };
}

export async function saveClinicalNote(data: { patientId: string, appointmentId: string, content: string }) {
  const { data: note, error } = await supabase
    .from('clinical_notes')
    .insert([{ 
      patient_id: data.patientId, 
      appointment_id: data.appointmentId, 
      content: data.content 
    }])
    .select()
    .single();

  if (error) throw new Error('Error saving clinical note: ' + error.message);
  return note;
}

export async function updatePatientProfile(patientId: string, updates: { dni?: string, phone?: string, email?: string }) {
  const { data, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', patientId)
    .select()
    .single();

  if (error) {
    if (error.code === '23505' && error.message.includes('unique_dni')) {
      throw new Error('Ese DNI ya se encuentra registrado para otro paciente.');
    }
    throw new Error('Error actualizando paciente: ' + error.message);
  }
  return data;
}

export async function getTreatmentsList() {
  const { data, error } = await supabase
    .from('treatments')
    .select('*')
    .order('name');
  if (error) throw new Error('Error fetching treatments: ' + error.message);
  return data || [];
}

export async function assignPatientTreatment(patientId: string, treatmentId: string) {
  const { data, error } = await supabase
    .from('patient_treatments')
    .insert([{ patient_id: patientId, treatment_id: treatmentId }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Este tratamiento ya está asignado al paciente.');
    throw new Error('Error asignando tratamiento: ' + error.message);
  }
  return data;
}
