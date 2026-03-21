'use client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/infrastructure/supabase/client';
import { Appointment } from '@/domain/entities/appointment';

export function useAppointments(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['appointments', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(*),
          treatment:treatments(*)
        `)
        .gte('start_time', startDate)
        .lt('start_time', endDate)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    }
  });
}
