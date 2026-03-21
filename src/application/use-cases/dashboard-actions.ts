'use server';
import { supabase } from '@/infrastructure/supabase/client';

export async function getWeeklyDashboardData(startIso: string, endIso: string) {
  const [apptRes, blocksRes] = await Promise.all([
    supabase
      .from('appointments')
      .select('*, patient:patients(*), treatment:treatments(*)')
      .gte('start_time', startIso)
      .lte('start_time', endIso)
      .order('start_time', { ascending: true }),
    supabase
      .from('schedule_blocks')
      .select('*')
      .gte('start_time', startIso)
      .lte('start_time', endIso)
  ]);

  return {
    appointments: apptRes.data || [],
    blocks: blocksRes.data || []
  };
}

export async function addScheduleBlock(startTime: string, endTime: string, reason: string | null) {
  const { data, error } = await supabase
    .from('schedule_blocks')
    .insert([{ start_time: startTime, end_time: endTime, reason }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function checkOverlappingAppointments(startIso: string, endIso: string) {
  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .not('status', 'eq', 'cancelled')
    .lt('start_time', endIso)
    .gt('end_time', startIso);

  if (error) throw new Error(error.message);
  return count || 0;
}

export async function updateAppointmentStatus(id: string, status: 'completed' | 'cancelled' | 'pending' | 'confirmed') {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
