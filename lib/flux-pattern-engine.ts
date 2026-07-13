// flux-pattern-engine.ts
// The read path. Every function here either reads a cached insight or
// recomputes it from local SQLite — no network, no AI API, no external
// calls. This is the entire "intelligence" layer of Flux, and it's just
// SQL + simple math.
//
// NOTE on schema: this assumes pattern_type has a UNIQUE constraint on
// patterns_cache (small addition to the original migration) so the
// upsert below works:
//   ALTER TABLE patterns_cache ADD CONSTRAINT uq_pattern_type UNIQUE (pattern_type);
// or simply declare it UNIQUE in the original CREATE TABLE.

import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  PatternType,
  PatternResult,
  EnergyRhythmResult,
  TagMoodCorrelationRow,
  BurnoutPrecursorResult,
  HydrationInsightResult,
} from './flux-types';

// ---------------------------------------------------------------------------
// Public entry point — this is the only function the UI should call.
// It hides whether the result came from cache or a live computation.
// ---------------------------------------------------------------------------

export async function getPattern<T = unknown>(
  db: SQLiteDatabase,
  type: PatternType
): Promise<PatternResult<T>> {
  const cached = await db.getFirstAsync<{
    pattern_type: string;
    data: string;
    computed_at: string;
    is_stale: number;
    valid_until: string | null;
  }>(`SELECT * FROM patterns_cache WHERE pattern_type = ?`, [type]);

  if (cached && !cached.is_stale) {
    return {
      patternType: type,
      data: JSON.parse(cached.data) as T,
      computedAt: cached.computed_at,
      isStale: false,
      validUntil: cached.valid_until,
    };
  }

  const data = (await COMPUTE_FNS[type](db)) as T;
  await db.runAsync(
    `INSERT INTO patterns_cache (pattern_type, data, computed_at, is_stale)
     VALUES (?, ?, CURRENT_TIMESTAMP, 0)
     ON CONFLICT(pattern_type) DO UPDATE SET
       data = excluded.data,
       computed_at = excluded.computed_at,
       is_stale = 0`,
    [type, JSON.stringify(data)]
  );

  return {
    patternType: type,
    data,
    computedAt: new Date().toISOString(),
    isStale: false,
    validUntil: null,
  };
}

/** Call this once, right after any new check-in or workout is written.
 *  Cheap write now, avoids ever showing the user a stale insight. */
export async function invalidatePatternCache(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(`UPDATE patterns_cache SET is_stale = 1`);
}

// ---------------------------------------------------------------------------
// Individual pattern computations
// ---------------------------------------------------------------------------

async function computeEnergyRhythm(db: SQLiteDatabase): Promise<EnergyRhythmResult> {
  const rows = await db.getAllAsync<{ dow: string; avg_energy: number; samples: number }>(
    `SELECT strftime('%w', date) AS dow,
            AVG(energy_level)    AS avg_energy,
            COUNT(*)             AS samples
     FROM   check_ins
     WHERE  date >= date('now', '-60 days')
     GROUP  BY dow
     ORDER  BY dow`
  );

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const byDay = rows.map((r) => ({
    day: dayNames[Number(r.dow)],
    avgEnergy: round1(r.avg_energy),
    samples: r.samples,
  }));

  // Require at least 3 samples before trusting a day's average — a single
  // rough Wednesday shouldn't look like a permanent personality trait.
  const reliable = byDay.filter((d) => d.samples >= 3);
  const lowest = reliable.length
    ? reliable.reduce((a, b) => (a.avgEnergy < b.avgEnergy ? a : b))
    : null;
  const highest = reliable.length
    ? reliable.reduce((a, b) => (a.avgEnergy > b.avgEnergy ? a : b))
    : null;

  return { byDay, lowestDay: lowest, highestDay: highest };
}

async function computeTagMoodCorrelation(db: SQLiteDatabase): Promise<TagMoodCorrelationRow[]> {
  const rows = await db.getAllAsync<{
    label: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    avg_mood: number;
    sessions: number;
  }>(
    `SELECT t.label, t.sentiment,
            AVG(w.mood_after) AS avg_mood,
            COUNT(*)          AS sessions
     FROM   workout_tags wt
     JOIN   workouts w ON wt.workout_id = w.id
     JOIN   tags     t ON wt.tag_id     = t.id
     WHERE  w.date >= date('now', '-30 days')
       AND  w.mood_after IS NOT NULL
     GROUP  BY t.id
     HAVING sessions >= 2
     ORDER  BY avg_mood DESC`
  );

  return rows.map((r) => ({
    label: r.label,
    sentiment: r.sentiment,
    avgMood: round1(r.avg_mood),
    sessions: r.sessions,
  }));
}

async function computeBurnoutPrecursor(db: SQLiteDatabase): Promise<BurnoutPrecursorResult> {
  const thisWeek = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM   workout_tags wt
     JOIN   workouts w ON wt.workout_id = w.id
     JOIN   tags     t ON wt.tag_id     = t.id
     WHERE  w.date >= date('now', '-7 days')
       AND  t.sentiment = 'negative'`
  );

  // Weekly negative-tag counts over the trailing month, used as this
  // user's personal baseline — never compared against other users.
  const trailing = await db.getAllAsync<{ week_start: string; count: number }>(
    `SELECT date(w.date, 'weekday 0', '-7 days') AS week_start,
            COUNT(*) AS count
     FROM   workout_tags wt
     JOIN   workouts w ON wt.workout_id = w.id
     JOIN   tags     t ON wt.tag_id     = t.id
     WHERE  w.date >= date('now', '-35 days')
       AND  t.sentiment = 'negative'
     GROUP  BY week_start`
  );

  const baseline =
    trailing.length > 0 ? trailing.reduce((sum, w) => sum + w.count, 0) / trailing.length : 0;

  const current = thisWeek?.count ?? 0;
  const isElevated = baseline > 0 && current > baseline * 1.5;

  return {
    currentWeekCount: current,
    fourWeekAverage: round1(baseline),
    isElevated,
  };
}

async function computeHydrationInsight(db: SQLiteDatabase): Promise<HydrationInsightResult> {
  const row = await db.getFirstAsync<{
    hydrated_mood: number | null;
    dehydrated_mood: number | null;
    hydrated_n: number;
    dehydrated_n: number;
  }>(
    `SELECT
       AVG(CASE WHEN t.label = 'Well hydrated'    THEN w.mood_after END) AS hydrated_mood,
       AVG(CASE WHEN t.label = 'Not enough water' THEN w.mood_after END) AS dehydrated_mood,
       SUM(CASE WHEN t.label = 'Well hydrated'    THEN 1 ELSE 0 END)    AS hydrated_n,
       SUM(CASE WHEN t.label = 'Not enough water' THEN 1 ELSE 0 END)    AS dehydrated_n
     FROM   workout_tags wt
     JOIN   workouts w ON wt.workout_id = w.id
     JOIN   tags     t ON wt.tag_id     = t.id
     WHERE  w.date >= date('now', '-60 days')`
  );

  // Don't surface this insight until there's enough on each side to mean
  // something — an opinion based on 2 data points isn't a pattern, and
  // showing it as one would erode trust in every other insight too.
  if (!row || row.hydrated_n < 3 || row.dehydrated_n < 2) {
    return { hasEnoughData: false };
  }

  const hydratedAvg = row.hydrated_mood ?? 0;
  const dehydratedAvg = row.dehydrated_mood ?? 0;

  return {
    hasEnoughData: true,
    hydratedAvgMood: round1(hydratedAvg),
    dehydratedAvgMood: round1(dehydratedAvg),
    difference: round1(hydratedAvg - dehydratedAvg),
  };
}

const COMPUTE_FNS: Record<PatternType, (db: SQLiteDatabase) => Promise<unknown>> = {
  day_energy_rhythm: computeEnergyRhythm,
  tag_mood_correlation: computeTagMoodCorrelation,
  burnout_precursor: computeBurnoutPrecursor,
  hydration_insight: computeHydrationInsight,
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
