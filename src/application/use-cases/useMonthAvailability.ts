'use client';
import { useQuery } from '@tanstack/react-query';
import { getMonthAvailabilityData } from '@/application/use-cases/booking-actions';

export function useMonthAvailability(year: number, month: number) {
  return useQuery({
    queryKey: ['monthAvailability', year, month],
    queryFn: () => getMonthAvailabilityData(year, month),
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });
}
