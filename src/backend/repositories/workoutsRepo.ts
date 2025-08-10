import { getDb } from '../../db';
import { WorkoutWithBodyPart } from '../../db/types';
import type { Workout } from '../../db/types';

export async function createWorkout(name: string, bodyPartId: number) {
  const db = await getDb();
  const res = await db.executeSql(
    'INSERT INTO workouts (body_part_id, name) VALUES (?, ?);',
    [bodyPartId, name]
  );
  return res[0].insertId;
}

export async function listWorkoutsByBodyPart(bodyPartId: number): Promise<Workout[]> {
  const db = await getDb();
  const res = await db.executeSql(
    'SELECT id, name FROM workouts WHERE body_part_id = ? ORDER BY name;',
    [bodyPartId]
  );
  return res[0].rows.raw() as Workout[];
}

/**
 * deleteWorkoutSafe:
 * - Only deletes a workout if it has NO logs (to avoid orphaned history).
 * - Returns { ok: boolean, reason?: string }
 */
export async function deleteWorkoutSafe(workoutId: number) {
  const db = await getDb();

  const res = await db.executeSql(
    'SELECT COUNT(*) AS c FROM workout_logs WHERE workout_id = ?;',
    [workoutId]
  );
  const count = res[0].rows.item(0)?.c ?? 0;

  if (count > 0) {
    return { ok: false, reason: 'Cannot delete: workout has logged sessions.' };
  }

  await db.executeSql('DELETE FROM workouts WHERE id = ?;', [workoutId]);
  return { ok: true };
}

/**
 * upsertWorkout:
 * - Inserts a workout for (body_part_id, name) if it doesn't exist.
 * - Thanks to the v2 UNIQUE index, duplicates are ignored safely.
 * - Returns the workout id.
 */
export async function upsertWorkout(name: string, bodyPartId: number) {
  const db = await getDb();

  await db.executeSql(
    'INSERT OR IGNORE INTO workouts (body_part_id, name) VALUES (?, ?);',
    [bodyPartId, name]
  );

  const res = await db.executeSql(
    'SELECT id FROM workouts WHERE body_part_id = ? AND name = ? LIMIT 1;',
    [bodyPartId, name]
  );

  return res[0].rows.item(0)?.id as number;
}

/**
 * listWorkoutsWithBodyPart
 * - Returns all workouts with their body part's display name.
 * - Optional 'q' to filter by workout or body part name (case-insensitive).
 * - Sorted by body part name, then workout name.
 */
//import { getDb } from '../../db';

export async function listWorkoutsWithBodyPart(q?: string): Promise<WorkoutWithBodyPart[]> {
  const db = await getDb();

  if (q && q.trim()) {
    const like = `%${q.trim()}%`;
    const res = await db.executeSql(
      `SELECT w.id,
              w.body_part_id,
              w.name,
              bp.name AS body_part_name
       FROM workouts w
       JOIN body_parts bp ON bp.id = w.body_part_id
       WHERE w.name LIKE ? OR bp.name LIKE ?
       ORDER BY bp.name COLLATE NOCASE ASC, w.name COLLATE NOCASE ASC;`,
      [like, like]
    );
    return res[0].rows.raw() as WorkoutWithBodyPart[];
  }

  const res = await db.executeSql(
    `SELECT w.id,
            w.body_part_id,
            w.name,
            bp.name AS body_part_name
     FROM workouts w
     JOIN body_parts bp ON bp.id = w.body_part_id
     ORDER BY bp.name COLLATE NOCASE ASC, w.name COLLATE NOCASE ASC;`
  );
  return res[0].rows.raw() as WorkoutWithBodyPart[];
}
