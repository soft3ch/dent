'use client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/infrastructure/supabase/client';
import { Treatment } from '@/domain/entities/treatment';

export function useTreatments() {
  return useQuery({
    queryKey: ['treatments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatments')
        .select('*');

      if (error) throw error;
      return data as Treatment[];
    }
  });
}
