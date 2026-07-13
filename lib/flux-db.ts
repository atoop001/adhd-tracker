import * as SQLite from 'expo-sqlite';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS check_ins (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  date             DATE    NOT NULL UNIQUE,
  energy_level     INTEGER NOT NULL CHECK (energy_level BETWEEN 1 AND 5),
  mood             INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  sleep_quality    INTEGER CHECK (sleep_quality BETWEEN 1 AND 3),
  stress_level     INTEGER CHECK (stress_level BETWEEN 1 AND 3),
  medication_taken BOOLEAN,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ci_date ON check_ins(date);

CREATE TABLE IF NOT EXISTS workouts (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  date             DATE    NOT NULL,
  started_at       TIMESTAMP,
  duration_minutes INTEGER,
  activity_type    TEXT    NOT NULL,
  mood_after       INTEGER CHECK (mood_after BETWEEN 1 AND 5),
  notes            TEXT,
  source           TEXT    NOT NULL DEFAULT 'manual',
  external_id      TEXT    UNIQUE,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (date) REFERENCES check_ins(date)
);
CREATE INDEX IF NOT EXISTS idx_w_date     ON workouts(date);
CREATE INDEX IF NOT EXISTS idx_w_activity ON workouts(activity_type);

CREATE TABLE IF NOT EXISTS tags (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  label      TEXT    NOT NULL UNIQUE,
  category   TEXT    NOT NULL,
  sentiment  TEXT    NOT NULL DEFAULT 'neutral'
             CHECK (sentiment IN ('positive','negative','neutral')),
  is_preset  BOOLEAN NOT NULL DEFAULT 0,
  use_count  INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_t_use_count ON tags(use_count DESC);
CREATE INDEX IF NOT EXISTS idx_t_category  ON tags(category);

CREATE TABLE IF NOT EXISTS workout_tags (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id INTEGER NOT NULL,
  tag_id     INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (workout_id, tag_id),
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)     REFERENCES tags(id)
);
CREATE INDEX IF NOT EXISTS idx_wt_workout ON workout_tags(workout_id);
CREATE INDEX IF NOT EXISTS idx_wt_tag     ON workout_tags(tag_id);

CREATE TABLE IF NOT EXISTS bucket (
  id                INTEGER PRIMARY KEY DEFAULT 1,
  lifetime_drops    INTEGER NOT NULL DEFAULT 0,
  current_tier      INTEGER NOT NULL DEFAULT 1,
  total_workouts    INTEGER NOT NULL DEFAULT 0,
  last_workout_date DATE,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patterns_cache (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern_type TEXT    NOT NULL UNIQUE,
  data         TEXT    NOT NULL,
  computed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_stale     BOOLEAN NOT NULL DEFAULT 0,
  valid_until  TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pc_type  ON patterns_cache(pattern_type);
CREATE INDEX IF NOT EXISTS idx_pc_stale ON patterns_cache(is_stale);

CREATE TABLE IF NOT EXISTS body_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       DATE    NOT NULL,
  weight     REAL,
  waist_cm   REAL,
  chest_cm   REAL,
  hips_cm    REAL,
  arms_cm    REAL,
  notes      TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bl_date ON body_logs(date);

CREATE TABLE IF NOT EXISTS calorie_logs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  date           DATE    NOT NULL UNIQUE,
  total_calories INTEGER NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cl_date ON calorie_logs(date);

CREATE TABLE IF NOT EXISTS wearable_data (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  date               DATE    NOT NULL UNIQUE,
  resting_hr         REAL,
  hrv                REAL,
  sleep_minutes      INTEGER,
  sleep_score        REAL,
  steps              INTEGER,
  active_energy_kcal REAL,
  source             TEXT    NOT NULL,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wd_date ON wearable_data(date);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO bucket (id) VALUES (1);

INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES
  ('notification_enabled',   'false', CURRENT_TIMESTAMP),
  ('notification_time',      '08:00', CURRENT_TIMESTAMP),
  ('medication_tracking',    'false', CURRENT_TIMESTAMP),
  ('reduce_animations',      'false', CURRENT_TIMESTAMP),
  ('body_metrics_enabled',   'false', CURRENT_TIMESTAMP),
  ('calorie_tracking',       'false', CURRENT_TIMESTAMP),
  ('weight_unit',            'kg',    CURRENT_TIMESTAMP),
  ('weekly_goal',            '3',     CURRENT_TIMESTAMP),
  ('social_notif_checkin',   'false', CURRENT_TIMESTAMP),
  ('social_notif_challenge', 'false', CURRENT_TIMESTAMP),
  ('onboarding_complete',    'false', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO tags (label, category, sentiment, is_preset) VALUES
  ('Well hydrated',            'nutrition',   'positive', 1),
  ('Not enough water',         'nutrition',   'negative', 1),
  ('Ate well',                 'nutrition',   'positive', 1),
  ('Ate too soon',             'nutrition',   'negative', 1),
  ('Ate too late',             'nutrition',   'negative', 1),
  ('Good pace',                'effort',      'positive', 1),
  ('Strong finish',            'effort',      'positive', 1),
  ('Had more left',            'effort',      'positive', 1),
  ('Went out too hard',        'effort',      'negative', 1),
  ('Burned out halfway',       'effort',      'negative', 1),
  ('Locked in',                'mental',      'positive', 1),
  ('Distracted throughout',    'mental',      'negative', 1),
  ('Anxious before starting',  'mental',      'negative', 1),
  ('Good sleep',               'pre_workout', 'positive', 1),
  ('Poor sleep',               'pre_workout', 'negative', 1),
  ('Tired but pushed through', 'pre_workout', 'neutral',  1),
  ('Stressed beforehand',      'pre_workout', 'negative', 1),
  ('Felt calm',                'pre_workout', 'positive', 1),
  ('Too noisy',                'environment', 'negative', 1),
  ('Had company',              'environment', 'positive', 1),
  ('Worked out alone',         'environment', 'neutral',  1);
`;

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  const db = await SQLite.openDatabaseAsync('flux.db');
  await db.execAsync(SCHEMA_SQL);
  _db = db;
  return _db;
}
