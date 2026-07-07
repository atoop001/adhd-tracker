// flux-workout-service.ts
// The write path. Everything a user action triggers — logging a workout,
// applying tags, updating the streak — lives here. The pattern engine
// (read path) and this service (write path) deliberately don't share
// functions, so it's always clear which side of the system you're in.

import type { SQLiteDatabase } from 'expo-sqlite';
import type { StreakState, WorkoutSource } from './flux-types';
import { invalidatePatternCache } from './flux-pattern-engine';

const MAX_BANKED_REST_DAYS = 3;
const EARN_REST_DAY_EVERY_N_STREAK_DAYS = 7;

// ---------------------------------------------------------------------------
// Streak forgiveness — the core retention mechanic for ADHD users.
// A missed day spends a banked rest day silently rather than breaking
// the streak. Users never see punitive language for this; the streak
// number just keeps climbing as if nothing happened.
// ---------------------------------------------------------------------------

export async function getStreakState(db: SQLiteDatabase): Promise<StreakState> {
  const row = await db.getFirstAsync<{
    current_streak: number;
    longest_streak: number;
    last_active_date: string | null;
    rest_days_banked: number;
    total_workouts: number;
  }>(`SELECT * FROM streaks WHERE id = 1`);

  if (!row) {
    throw new Error('streaks row missing — run the seed INSERT from the migration');
  }

  return {
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastActiveDate: row.last_active_date,
    restDaysBanked: row.rest_days_banked,
    totalWorkouts: row.total_workouts,
  };
}

/** Call once per day on app open, BEFORE the user has done anything today.
 *  Looks at the gap since the last active day and either spends a banked
 *  rest day to preserve the streak, or resets it — but never shames. */
export async function evaluateStreakOnAppOpen(db: SQLiteDatabase, today: string): Promise<void> {
  const state = await getStreakState(db);
  if (!state.lastActiveDate) return; // brand new user, nothing to evaluate yet

  const gap = daysBetween(state.lastActiveDate, today);
  if (gap <= 1) return; // active yesterday or today — streak is fine as-is

  const missedDays = gap - 1;

  if (missedDays <= state.restDaysBanked) {
    await db.runAsync(
      `UPDATE streaks SET rest_days_banked = rest_days_banked - ? WHERE id = 1`,
      [missedDays]
    );
  } else {
    // Reset, but quietly — no "you broke your streak" messaging anywhere
    // downstream. The UI should treat a reset streak the same as a new one.
    await db.runAsync(`UPDATE streaks SET current_streak = 0 WHERE id = 1`);
  }
}

/** Call immediately after a workout or check-in is logged for `today`. */
async function recordActivityForStreak(db: SQLiteDatabase, today: string): Promise<void> {
  const state = await getStreakState(db);
  if (state.lastActiveDate === today) return; // already counted today

  const newStreak = state.currentStreak + 1;
  const newLongest = Math.max(state.longestStreak, newStreak);

  const earnedRestDay = newStreak > 0 && newStreak % EARN_REST_DAY_EVERY_N_STREAK_DAYS === 0;
  const newBanked = Math.min(MAX_BANKED_REST_DAYS, state.restDaysBanked + (earnedRestDay ? 1 : 0));

  await db.runAsync(
    `UPDATE streaks
     SET current_streak = ?, longest_streak = ?, last_active_date = ?,
         rest_days_banked = ?, total_workouts = total_workouts + 1
     WHERE id = 1`,
    [newStreak, newLongest, today, newBanked]
  );
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

// ---------------------------------------------------------------------------
// Tags — quick-access promotion and custom tag creation
// ---------------------------------------------------------------------------

export async function getQuickAccessTags(db: SQLiteDatabase, limit = 6) {
  return db.getAllAsync(
    `SELECT * FROM tags ORDER BY use_count DESC, label ASC LIMIT ?`,
    [limit]
  );
}

/** Finds an existing tag by label or creates a new custom one.
 *  Reused both for presets the user taps and free-text custom tags. */
export async function getOrCreateTag(db: SQLiteDatabase, label: string): Promise<number> {
  const existing = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM tags WHERE label = ?`,
    [label]
  );
  if (existing) return existing.id;

  const result = await db.runAsync(
    `INSERT INTO tags (label, category, sentiment, is_preset, use_count)
     VALUES (?, 'custom', 'neutral', 0, 0)`,
    [label]
  );
  return result.lastInsertRowId;
}

async function bumpTagUseCount(db: SQLiteDatabase, tagId: number): Promise<void> {
  await db.runAsync(`UPDATE tags SET use_count = use_count + 1 WHERE id = ?`, [tagId]);
}

// ---------------------------------------------------------------------------
// The single orchestration entry point — this is what the "Done" button
// on the log screen calls. It ties together the workout insert, tag
// linking, streak update, and cache invalidation in the right order.
// ---------------------------------------------------------------------------

export interface LogWorkoutInput {
  date: string;
  activityType: string;
  durationMinutes?: number;
  moodAfter?: number;
  notes?: string;
  source?: WorkoutSource;
  externalId?: string;
}

export async function logWorkoutWithTags(
  db: SQLiteDatabase,
  workout: LogWorkoutInput,
  tagIds: number[]
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO workouts
       (date, activity_type, duration_minutes, mood_after, notes, source, external_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      workout.date,
      workout.activityType,
      workout.durationMinutes ?? null,
      workout.moodAfter ?? null,
      workout.notes ?? null,
      workout.source ?? 'manual',
      workout.externalId ?? null,
    ]
  );
  const workoutId = result.lastInsertRowId;

  for (const tagId of tagIds) {
    await db.runAsync(
      `INSERT OR IGNORE INTO workout_tags (workout_id, tag_id) VALUES (?, ?)`,
      [workoutId, tagId]
    );
    await bumpTagUseCount(db, tagId);
  }

  await recordActivityForStreak(db, workout.date);
  await invalidatePatternCache(db);

  return workoutId;
}

export async function logCheckIn(
  db: SQLiteDatabase,
  checkIn: {
    date: string;
    energyLevel: number;
    mood: number;
    sleepQuality?: number;
    stressLevel?: number;
    medicationTaken?: boolean;
  }
): Promise<void> {
  await db.runAsync(
    `INSERT INTO check_ins (date, energy_level, mood, sleep_quality, stress_level, medication_taken)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       energy_level = excluded.energy_level,
       mood = excluded.mood,
       sleep_quality = excluded.sleep_quality,
       stress_level = excluded.stress_level,
       medication_taken = excluded.medication_taken`,
    [
      checkIn.date,
      checkIn.energyLevel,
      checkIn.mood,
      checkIn.sleepQuality ?? null,
      checkIn.stressLevel ?? null,
      checkIn.medicationTaken ?? null,
    ]
  );

  await invalidatePatternCache(db);
}
