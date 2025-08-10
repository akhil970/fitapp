/**
 * bodyPartsRepo.ts
 * - Minimal CRUD for body_parts
 * - Safe delete (only if no workouts reference it)
 */

import { getDb } from '../../db';
import { BodyPart } from '../../db/types';

/** List all body parts (alphabetical) */
export async function listBodyParts(): Promise<BodyPart[]> {
  const db = await getDb();
  const res = await db.executeSql(
    'SELECT id, name FROM body_parts ORDER BY name ASC;'
  );
  return res[0].rows.raw() as BodyPart[];
}

/** Get a body part id by exact name (case-sensitive match) */
export async function getBodyPartIdByName(name: string): Promise<number | undefined> {
  const db = await getDb();
  const res = await db.executeSql(
    'SELECT id FROM body_parts WHERE name = ? LIMIT 1;',
    [name]
  );
  return res[0].rows.length ? (res[0].rows.item(0).id as number) : undefined;
}

/**
 * Create if missing; return id either way.
 * Relies on UNIQUE(name) in schema.
 */
export async function upsertBodyPart(name: string): Promise<number> {
  const db = await getDb();
  // Try to insert (ignored if exists thanks to UNIQUE)
  await db.executeSql(
    'INSERT OR IGNORE INTO body_parts (name) VALUES (?);',
    [name]
  );
  // Return existing/new id
  const res = await db.executeSql(
    'SELECT id FROM body_parts WHERE name = ? LIMIT 1;',
    [name]
  );
  return res[0].rows.item(0).id as number;
}

/**
 * Delete only if *no workouts* reference this body part.
 * Returns { ok, reason? } so the UI can show a helpful message later.
 */
export async function deleteBodyPartSafe(id: number): Promise<{ ok: boolean; reason?: string }> {
  const db = await getDb();

  const res = await db.executeSql(
    'SELECT COUNT(*) AS c FROM workouts WHERE body_part_id = ?;',
    [id]
  );
  const count = res[0].rows.item(0).c as number;

  if (count > 0) {
    return { ok: false, reason: 'Cannot delete: workouts are linked to this body part.' };
  }

  await db.executeSql('DELETE FROM body_parts WHERE id = ?;', [id]);
  return { ok: true };
}
