import { getDb } from '../../db';

export async function deleteArmsBodyPart() {
  const db = await getDb();
  // Find ARMS body part
  const res = await db.executeSql('SELECT id FROM body_parts WHERE name = ?;', ['Arms']);
  if (res[0].rows.length === 0) {
    console.log('No ARMS body part found.');
    return;
  }
  const armsId = res[0].rows.item(0).id;
  // Delete all workouts for ARMS
  await db.executeSql('DELETE FROM workouts WHERE body_part_id = ?;', [armsId]);
  // Delete ARMS body part
  await db.executeSql('DELETE FROM body_parts WHERE id = ?;', [armsId]);
  console.log('ARMS body part and its workouts deleted.');
}

// Temporary script entry point
if (require.main === module) {
  (async () => {
    await deleteArmsBodyPart();
    process.exit(0);
  })();
}
