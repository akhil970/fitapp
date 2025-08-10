/**
 * authRepo.ts
 * - Stores a single user's credentials.
 * - NOTE: store a HASH here, not a plain password.
 */

import { getDb } from '../../db';

export async function upsertCredentials(username: string, passwordHash: string) {
  const db = await getDb();
  // Keep only one row; replace if exists
  await db.transaction(tx => {
    tx.executeSql('DELETE FROM user_credentials;');
    tx.executeSql(
      'INSERT INTO user_credentials (username, password_hash) VALUES (?, ?);',
      [username, passwordHash]
    );
  });
}

export async function getCredentials() {
  const db = await getDb();
  const res = await db.executeSql(
    'SELECT id, username, password_hash, created_at FROM user_credentials LIMIT 1;'
  );
  return res[0].rows.item(0) as
    | { id: number; username: string; password_hash: string; created_at: string }
    | undefined;
}
