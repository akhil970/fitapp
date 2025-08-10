// Central TS interfaces so repos return consistent shapes

export interface BodyPart {
  id: number;
  name: string;
}

export interface Workout {
  id: number;
  body_part_id: number;
  name: string;
}

export interface WorkoutLog {
  id: number;
  workout_id: number;
  logged_at: string; // ISO timestamp
}

export interface WorkoutSet {
  id: number;
  workout_log_id: number;
  set_number: number;
  reps: number;
  weight: number;
  performed_at: string; // ISO timestamp
}

// A workout row joined with its body part name
export interface WorkoutWithBodyPart {
  id: number;
  body_part_id: number;
  name: string;
  body_part_name: string;
}

export interface WorkoutSummary {
  workout_id: number;
  workout_name: string;
  body_part_id: number;
  body_part_name: string;
  sessions: number;          // how many workout_logs
  last_logged_at: string | null;
  last_volume: number | null; // reps*weight sum for the most recent session
}
