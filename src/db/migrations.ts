/**
 * migrations.ts
 * Uses SQLite's built-in PRAGMA user_version to track schema version.
 * - Start at v1 (your current tables)
 * - v2 adds helpful indexes + a unique constraint for workouts per body part
 */

import type SQLite from 'react-native-sqlite-storage';

export async function runMigrations(db: SQLite.SQLiteDatabase) {
  // Read current version
  const res = await db.executeSql('PRAGMA user_version;');
  // On RN SQLite, the column is called "user_version"
  const current = res[0].rows.item(0)?.user_version ?? 0;

  // v2: indexes + unique workout name per body part
  if (current < 2) {
    await v2_AddIndexesAndUniqueWorkout(db);
    await db.executeSql('PRAGMA user_version = 2;');
  }
}

/** v2: add indexes for speed + unique constraint per (body_part_id, name) */
async function v2_AddIndexesAndUniqueWorkout(db: SQLite.SQLiteDatabase) {
  await db.transaction(tx => {
    // Prevent duplicate workout names under the same body part
    tx.executeSql(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_workouts_unique ON workouts(body_part_id, name);'
    );
    // Speed up common joins/filters
    tx.executeSql(
      'CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_id ON workout_logs(workout_id);'
    );
    tx.executeSql(
      'CREATE INDEX IF NOT EXISTS idx_workout_sets_log_id ON workout_sets(workout_log_id);'
    );
  });
}
