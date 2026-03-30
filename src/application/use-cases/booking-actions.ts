'use server';
import { supabase } from '@/infrastructure/supabase/client';
import { addMinutes, parse, format, isBefore, isAfter, isValid } from 'date-fns';

export async function getAvailableSlots(dateStr: string, treatmentId: string) {
  try {
    const dateObj = new Date(dateStr);
    if (!isValid(dateObj)) return [];

    // getDay() 0 is Sunday, 1 is Monday ... maps exactly to DB format day_of_week
    const dayOfWeek = dateObj.getDay();

    // 1. Get doctor schedule for that day
    const { data: scheduleData } = await supabase
      .from('doctor_schedule')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('is_working_day', true);

    if (!scheduleData || scheduleData.length === 0) return [];

    // 2. Get treatment duration
    // In a real scenario, we'd fetch actual real treatments. We default to 30 mins if treatment not found.
    let duration = 30;
    if (treatmentId) {
      const { data: treatmentData } = await supabase
        .from('treatments')
        .select('duration_minutes')
        .eq('id', treatmentId)
        .single();
      if (treatmentData) {
        duration = treatmentData.duration_minutes || 30;
      }
    }

    // 3. Get existing appointments and blocks for that day
    const startOfDay = `${dateStr}T00:00:00Z`; // Minimal UTC boundary
    const endOfDay = `${dateStr}T23:59:59Z`;

    const [{ data: appointments }, { data: blocks }] = await Promise.all([
      supabase
        .from('appointments')
        .select('start_time, end_time, status')
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .not('status', 'eq', 'cancelled'),
      supabase
        .from('schedule_blocks')
        .select('start_time, end_time')
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
    ]);

    const busyRanges = [
      ...(appointments || []).map(a => ({
        start: new Date(a.start_time),
        end: a.end_time ? new Date(a.end_time) : addMinutes(new Date(a.start_time), duration)
      })),
      ...(blocks || []).map(b => ({
        start: new Date(b.start_time),
        end: new Date(b.end_time)
      }))
    ];

    // 4. Generate candidate slots
    const availableSlots: string[] = [];
    const baseDate = dateStr;

    for (const period of scheduleData) {
      // Assuming period.start_time format is '08:00:00'
      const timeFmt = period.start_time.length === 5 ? 'HH:mm' : 'HH:mm:ss';

      let currentSlot = parse(`${baseDate} ${period.start_time}`, `yyyy-MM-dd ${timeFmt}`, new Date());
      const endFmt = period.end_time.length === 5 ? 'HH:mm' : 'HH:mm:ss';
      const periodEnd = parse(`${baseDate} ${period.end_time}`, `yyyy-MM-dd ${endFmt}`, new Date());

      while (isBefore(currentSlot, periodEnd)) {
        const slotEnd = addMinutes(currentSlot, duration);

        if (isAfter(slotEnd, periodEnd)) break;

        const isOverlapping = busyRanges.some(range => {
          return isBefore(currentSlot, range.end) && isAfter(slotEnd, range.start);
        });

        if (!isOverlapping) {
          availableSlots.push(format(currentSlot, 'HH:mm'));
        }

        // We use an interval of 30 minutes for checking slots.
        currentSlot = addMinutes(currentSlot, 30);
      }
    }

    return Array.from(new Set(availableSlots)).sort();
  } catch (error) {
    console.error('Error in getAvailableSlots:', error);
    return [];
  }
}

export async function bookAppointment(data: {
  fullName: string;
  phone: string;
  reason: string;
  treatmentId: string | null;
  dateStr: string;
  timeStr: string;
  paymentMethod: string;
  insuranceName: string | null;
  email: string;
}) {
  const { fullName, phone, reason, treatmentId, dateStr, timeStr, paymentMethod, insuranceName, email } = data;

  if (!fullName || !phone || !email || !dateStr || !timeStr) {
    throw new Error('Missing required fields');
  }

  // 1. Ensure Patient exists or create
  let patientId = null;
  const { data: existingPatient } = await supabase
    .from('patients')
    .select('id')
    .eq('phone', phone)
    .single();

  if (existingPatient) {
    patientId = existingPatient.id;
  } else {
    // Insert new
    const { data: newPatient, error: pError } = await supabase
      .from('patients')
      .insert([{ full_name: fullName, phone, email }])
      .select('id')
      .single();
    if (pError) throw new Error('Error creating patient: ' + pError.message);
    patientId = newPatient.id;
  }

  // Format to standard ISO
  // Combining '2023-10-24' and '09:00'
  const startDateTime = new Date(`${dateStr}T${timeStr}:00`);

  const insertPayload: any = {
    patient_id: patientId,
    start_time: startDateTime.toISOString(),
    notes: reason || null,
    status: 'pending',
    payment_method: paymentMethod,
    insurance_name: insuranceName
  };

  if (treatmentId) {
    insertPayload.treatment_id = treatmentId;
  }

  const { data: appointment, error: appError } = await supabase
    .from('appointments')
    .insert([insertPayload])
    .select(`
      *,
      patient:patients(*),
      treatment:treatments(*)
    `)
    .single();

  if (appError) throw new Error('Error booking appointment: ' + appError.message);

  return appointment;
}

export async function getMonthAvailabilityData(year: number, month: number) {
  // month is 0-indexed in JS
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const [scheduleRes, apptRes, blocksRes] = await Promise.all([
    supabase.from('doctor_schedule').select('*').eq('is_working_day', true),
    supabase
      .from('appointments')
      .select('start_time, end_time, status')
      .gte('start_time', startIso)
      .lte('start_time', endIso)
      .not('status', 'eq', 'cancelled'),
    supabase
      .from('schedule_blocks')
      .select('start_time, end_time')
      .gte('start_time', startIso)
      .lte('start_time', endIso)
  ]);

  return {
    schedule: scheduleRes.data || [],
    appointments: apptRes.data || [],
    blocks: blocksRes.data || []
  };
}
