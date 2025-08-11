import { getDb } from './index';

/**
 * This file is for running ad-hoc queries directly on the database for development and maintenance.
 * DO NOT import or use this file in any frontend or UI code.
 * You can add, modify, or run queries here as needed for debugging, migration, or cleanup.
 */

export async function runDevQuery(sql: string, params: any[] = []) {
  const db = await getDb();
  return db.executeSql(sql, params);
}

// Example usage:
await runDevQuery('DELETE FROM body_parts WHERE name = ?', ['SHOULDERS']);
// await runDevQuery('SELECT * FROM workouts WHERE body_part_id = ?', [1]);
