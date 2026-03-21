export interface Treatment {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  color_code: string | null;
  created_at: string;
}
