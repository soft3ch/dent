'use client';
import { useQuery } from '@tanstack/react-query';
import { getWeeklyDashboardData } from './dashboard-actions';

export function useDashboardData(startIso: string | null, endIso: string | null) {
  return useQuery({
    queryKey: ['dashboardData', startIso, endIso],
    queryFn: () => {
      if (!startIso || !endIso) return { appointments: [], blocks: [] };
      return getWeeklyDashboardData(startIso, endIso);
    },
    enabled: !!startIso && !!endIso,
    staleTime: 60 * 1000 // 1 minute cache, though realtime invalidates it instantly
  });
}
