// __tests__/flux-bucket-fixture.ts

import type { SQLiteDatabase } from 'expo-sqlite';

/** The frozen test fixture predates the bucket mechanic; layer the bucket
 *  table (matching lib/flux-db.ts exactly) onto a createTestDb() database. */
export async function ensureBucketTable(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS bucket (
      id                INTEGER PRIMARY KEY DEFAULT 1,
      lifetime_drops    INTEGER NOT NULL DEFAULT 0,
      current_tier      INTEGER NOT NULL DEFAULT 1,
      total_workouts    INTEGER NOT NULL DEFAULT 0,
      last_workout_date DATE,
      updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    INSERT OR IGNORE INTO bucket (id) VALUES (1);
  `);
}
