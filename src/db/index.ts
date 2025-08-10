// src/db/index.ts
import SQLite from 'react-native-sqlite-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runMigrations } from './migrations';

SQLite.enablePromise(true);

const DB_NAME = 'fitness.db';
const INIT_FLAG = '@db_initialized_v1';

const CREATE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS user_credentials (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     username TEXT NOT NULL UNIQUE,
     password_hash TEXT NOT NULL,
     created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE TABLE IF NOT EXISTS body_parts (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL UNIQUE
   );`,
  `CREATE TABLE IF NOT EXISTS workouts (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     body_part_id INTEGER NOT NULL REFERENCES body_parts(id),
     name TEXT NOT NULL
   );`,
  `CREATE TABLE IF NOT EXISTS workout_logs (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     workout_id INTEGER NOT NULL REFERENCES workouts(id),
     logged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE TABLE IF NOT EXISTS workout_sets (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     workout_log_id INTEGER NOT NULL REFERENCES workout_logs(id),
     set_number INTEGER NOT NULL,
     reps INTEGER NOT NULL,
     weight REAL NOT NULL,
     performed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`
];

const DEFAULT_BODY_PARTS = ['Chest','Back','Legs','Shoulders','Arms','Abs'];

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  const db = await SQLite.openDatabase({ name: DB_NAME, location: 'default' });
  await db.executeSql('PRAGMA foreign_keys = ON');
  SQLite.DEBUG(true);

const isInitialized = await AsyncStorage.getItem(INIT_FLAG);
if (!isInitialized) {
  // 1) Create tables in a single transaction
  await db.transaction(tx => {
    CREATE_STATEMENTS.forEach(sql => tx.executeSql(sql));
  });

  // 2) Seed defaults in a separate transaction
  await db.transaction(tx => {
    DEFAULT_BODY_PARTS.forEach(name =>
      tx.executeSql(`INSERT OR IGNORE INTO body_parts (name) VALUES (?);`, [name])
    );
  });

  // mark baseline schema as v1
  await db.executeSql('PRAGMA user_version = 1;');
  await AsyncStorage.setItem(INIT_FLAG, 'true');
}
  // Always run forward migrations if needed
  await runMigrations(db);
  dbInstance = db;
  return db;
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  return dbInstance ?? initDatabase();
}

