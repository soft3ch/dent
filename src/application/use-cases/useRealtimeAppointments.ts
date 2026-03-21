'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/infrastructure/supabase/client';

export function useRealtimeAppointments() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const appointmentsChannel = supabase
      .channel('public:appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['appointments'] });
          queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
          queryClient.invalidateQueries({ queryKey: ['monthAvailability'] });
        }
      )
      .subscribe();

    const blocksChannel = supabase
      .channel('public:schedule_blocks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedule_blocks' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
          queryClient.invalidateQueries({ queryKey: ['monthAvailability'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(blocksChannel);
    };
  }, [queryClient]);
}
