// __tests__/flux-test-utils.ts
//
// Tests run in plain Node, but expo-sqlite is a native module that only
// works inside the actual app. The fix: wrap better-sqlite3 (synchronous,
// runs fine in Node) behind the exact async interface expo-sqlite exposes
// — runAsync / getFirstAsync / getAllAsync — so flux-pattern-engine.ts and
// flux-workout-service.ts run completely unmodified in tests.
//
// devDependencies needed: better-sqlite3, @types/better-sqlite3

import Database from 'better-sqlite3';
import type { SQLiteDatabase } from 'expo-sqlite';

// Mirrors the production schema, with one addition: pattern_type is
// UNIQUE on patterns_cache, which the real migration needs too — the
// ON CONFLICT upsert in getPattern() depends on it.
const SCHEMA_SQL = `
CREATE TABLE check_ins (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        DATE    NOT NULL UNIQUE,
  energy_level INTEGER NOT NULL CHECK (energy_level BETWEEN 1 AND 5),
  mood        INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 3),
  stress_level  INTEGER CHECK (stress_level BETWEEN 1 AND 3),
  medication_taken BOOLEAN,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workouts (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  date           DATE    NOT NULL,
  started_at     TIMESTAMP,
  duration_minutes INTEGER,
  activity_type  TEXT    NOT NULL,
  mood_after     INTEGER CHECK (mood_after BETWEEN 1 AND 5),
  notes          TEXT,
  source         TEXT    NOT NULL DEFAULT 'manual',
  external_id    TEXT    UNIQUE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  label     TEXT    NOT NULL UNIQUE,
  category  TEXT    NOT NULL,
  sentiment TEXT    NOT NULL DEFAULT 'neutral'
            CHECK (sentiment IN ('positive','negative','neutral')),
  is_preset BOOLEAN NOT NULL DEFAULT 0,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workout_tags (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id INTEGER NOT NULL,
  tag_id     INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (workout_id, tag_id)
);

CREATE TABLE streaks (
  id              INTEGER PRIMARY KEY DEFAULT 1,
  current_streak  INTEGER NOT NULL DEFAULT 0,
  longest_streak  INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  rest_days_banked INTEGER NOT NULL DEFAULT 0 CHECK (rest_days_banked <= 3),
  total_workouts  INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patterns_cache (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern_type TEXT    NOT NULL UNIQUE,
  data         TEXT    NOT NULL,
  computed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_stale     BOOLEAN NOT NULL DEFAULT 0,
  valid_until  TIMESTAMP
);

CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

/** Fresh in-memory DB, full schema, with the one seed row the app always
 *  expects to exist: a single streaks row with id = 1. */
export function createTestDb(): SQLiteDatabase {
  const raw = new Database(':memory:');
  raw.exec(SCHEMA_SQL);
  raw.prepare(`INSERT INTO streaks (id) VALUES (1)`).run();

  const adapter = {
    async runAsync(sql: string, params: any[] = []) {
      const info = raw.prepare(sql).run(...params);
      return { lastInsertRowId: Number(info.lastInsertRowid), changes: info.changes };
    },
    async getFirstAsync(sql: string, params: any[] = []) {
      return raw.prepare(sql).get(...params);
    },
    async getAllAsync(sql: string, params: any[] = []) {
      return raw.prepare(sql).all(...params);
    },
    async execAsync(sql: string) {
      raw.exec(sql);
    },
  };

  return adapter as unknown as SQLiteDatabase;
}

/** ISO date `n` days before today, in UTC — matches how SQLite's
 *  date('now', '-n days') resolves "today", so test fixtures and the
 *  SQL under test always agree on what "today" means, regardless of
 *  what day the test suite actually runs. */
export function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}

/** Maps a date string to the weekday label the pattern engine produces,
 *  via the same UTC interpretation SQLite's strftime('%w', date) uses. */
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function weekdayLabel(dateStr: string): string {
  return DAY_NAMES[new Date(`${dateStr}T00:00:00Z`).getUTCDay()];
}

// ---- Fixture helpers for pattern-engine tests that don't need the full
//      workout-service write path ----

export async function seedTag(
  db: SQLiteDatabase,
  label: string,
  sentiment: 'positive' | 'negative' | 'neutral',
  category = 'custom'
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO tags (label, category, sentiment, is_preset, use_count) VALUES (?, ?, ?, 0, 0)`,
    [label, category, sentiment]
  );
  return result.lastInsertRowId;
}

export async function seedWorkout(
  db: SQLiteDatabase,
  date: string,
  moodAfter: number | null,
  activityType = 'walk'
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO workouts (date, activity_type, mood_after) VALUES (?, ?, ?)`,
    [date, activityType, moodAfter]
  );
  return result.lastInsertRowId;
}

export async function tagWorkout(db: SQLiteDatabase, workoutId: number, tagId: number): Promise<void> {
  await db.runAsync(`INSERT INTO workout_tags (workout_id, tag_id) VALUES (?, ?)`, [workoutId, tagId]);
}
