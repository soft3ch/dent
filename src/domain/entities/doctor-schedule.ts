export interface DoctorSchedule {
  id: string;
  day_of_week: number;
  is_working_day: boolean;
  start_time: string;
  end_time: string;
  created_at: string;
}
