/**
 * logsRepo.ts
 * - Creates a workout "session" (workout_logs)
 * - Adds sets for that session (workout_sets)
 * - Reads back history for graphs/analytics
 */

import { getDb } from '../../db';
import { WorkoutSummary } from '../../db/types';

/** Create a workout session, returns the new workout_log row ID */
export async function createWorkoutLog(workoutId: number, loggedAtISO?: string) {
  const db = await getDb();
  const sql = loggedAtISO
    ? 'INSERT INTO workout_logs (workout_id, logged_at) VALUES (?, ?);'
    : 'INSERT INTO workout_logs (workout_id) VALUES (?);';
  const params = loggedAtISO ? [workoutId, loggedAtISO] : [workoutId];
  const res = await db.executeSql(sql, params);
  return res[0].insertId as number;
}

/** Add a single set to an existing session */
export async function addSet(
  workoutLogId: number,
  setNumber: number,
  reps: number,
  weight: number,
  performedAtISO?: string
) {
  const db = await getDb();
  const sql = performedAtISO
    ? `INSERT INTO workout_sets (workout_log_id, set_number, reps, weight, performed_at)
       VALUES (?, ?, ?, ?, ?);`
    : `INSERT INTO workout_sets (workout_log_id, set_number, reps, weight)
       VALUES (?, ?, ?, ?);`;
  const params = performedAtISO
    ? [workoutLogId, setNumber, reps, weight, performedAtISO]
    : [workoutLogId, setNumber, reps, weight];
  await db.executeSql(sql, params);
}

/**
 * Create a session and add multiple sets in ONE transaction.
 * Useful for saving a full workout at once from the UI.
 */
export async function addSessionWithSets(
  workoutId: number,
  sets: Array<{ setNumber: number; reps: number; weight: number; performedAtISO?: string }>,
  loggedAtISO?: string
) {
  const db = await getDb();

  // Phase 1: create the workout_log row
  const logId = await createWorkoutLog(workoutId, loggedAtISO);

  // Phase 2: insert sets in a single transaction (no async/await inside callback)
  await db.transaction(tx => {
    for (const s of sets) {
      if (s.performedAtISO) {
        tx.executeSql(
          `INSERT INTO workout_sets (workout_log_id, set_number, reps, weight, performed_at)
           VALUES (?, ?, ?, ?, ?);`,
          [logId, s.setNumber, s.reps, s.weight, s.performedAtISO]
        );
      } else {
        tx.executeSql(
          `INSERT INTO workout_sets (workout_log_id, set_number, reps, weight)
           VALUES (?, ?, ?, ?);`,
          [logId, s.setNumber, s.reps, s.weight]
        );
      }
    }
  });

  return logId;
}

/** Get all sets for a given session, ordered by set number */
export async function listSetsForLog(workoutLogId: number) {
  const db = await getDb();
  const res = await db.executeSql(
    `SELECT id, set_number, reps, weight, performed_at
     FROM workout_sets
     WHERE workout_log_id = ?
     ORDER BY set_number ASC;`,
    [workoutLogId]
  );
  return res[0].rows.raw() as Array<{
    id: number;
    set_number: number;
    reps: number;
    weight: number;
    performed_at: string;
  }>;
}

/**
 * Lightweight history for a workout:
 * - one row per session (log)
 * - total volume (sum reps*weight) + set count
 * Perfect for quick progress graphs.
 */
export async function getWorkoutHistory(workoutId: number, limit = 20, offset = 0) {
  const db = await getDb();
  const res = await db.executeSql(
    `SELECT wl.id AS log_id,
            wl.logged_at,
            COUNT(ws.id) AS set_count,
            SUM(ws.reps * ws.weight) AS total_volume
     FROM workout_logs wl
     LEFT JOIN workout_sets ws ON ws.workout_log_id = wl.id
     WHERE wl.workout_id = ?
     GROUP BY wl.id
     ORDER BY datetime(wl.logged_at) DESC
     LIMIT ? OFFSET ?;`,
    [workoutId, limit, offset]
  );
  return res[0].rows.raw() as Array<{
    log_id: number;
    logged_at: string;
    set_count: number;
    total_volume: number | null;
  }>;
}

/**
 * listWorkoutSummaries
 * - One row per workout.
 * - sessions: total number of logs for that workout.
 * - last_logged_at: most-recent session time.
 * - last_volume: total reps*weight for that most-recent session.
 */
export async function listWorkoutSummaries(limit = 50, offset = 0): Promise<WorkoutSummary[]> {
  const db = await getDb();
  const res = await db.executeSql(
    `
    WITH last_log AS (
      SELECT wl.workout_id,
             MAX(datetime(wl.logged_at)) AS last_logged_at
      FROM workout_logs wl
      GROUP BY wl.workout_id
    ),
    last_volume AS (
      SELECT wl.workout_id,
             wl.logged_at,
             SUM(ws.reps * ws.weight) AS volume
      FROM workout_logs wl
      LEFT JOIN workout_sets ws ON ws.workout_log_id = wl.id
      GROUP BY wl.id
    )
    SELECT w.id              AS workout_id,
           w.name            AS workout_name,
           bp.id             AS body_part_id,
           bp.name           AS body_part_name,
           COUNT(wl.id)      AS sessions,
           ll.last_logged_at AS last_logged_at,
           lv.volume         AS last_volume
    FROM workouts w
    JOIN body_parts bp ON bp.id = w.body_part_id
    LEFT JOIN workout_logs wl ON wl.workout_id = w.id
    LEFT JOIN last_log ll ON ll.workout_id = w.id
    LEFT JOIN last_volume lv ON lv.workout_id = w.id
                             AND lv.logged_at = ll.last_logged_at
    GROUP BY w.id
    ORDER BY datetime(ll.last_logged_at) DESC NULLS LAST, bp.name COLLATE NOCASE, w.name COLLATE NOCASE
    LIMIT ? OFFSET ?;
    `,
    [limit, offset]
  );

  return res[0].rows.raw() as WorkoutSummary[];
}

/** Summary for a single workout id (same fields as above) */
export async function getWorkoutSummary(workoutId: number): Promise<WorkoutSummary | undefined> {
  const rows = await listWorkoutSummaries(1, 0);
  return rows.find(r => r.workout_id === workoutId);
}
