/**
 * logsDashboardRepo.ts
 * - Specialized queries for dashboard analytics
 * - Fetches weights and reps for charting
 */

import { getDb } from '../../db';

/**
 * Get weights and reps for all logs of a workout (for dashboard charts)
 * Returns array of { logged_at, set_number, reps, weight }
 */
export async function getWeightsAndRepsForWorkout(workoutId: number) {
  const db = await getDb();
  const res = await db.executeSql(
    `SELECT wl.logged_at, ws.set_number, ws.reps, ws.weight
     FROM workout_logs wl
     JOIN workout_sets ws ON ws.workout_log_id = wl.id
     WHERE wl.workout_id = ?
     ORDER BY datetime(wl.logged_at) ASC, ws.set_number ASC;`,
    [workoutId]
  );
  return res[0].rows.raw() as Array<{
    logged_at: string;
    set_number: number;
    reps: number;
    weight: number;
  }>;
}
