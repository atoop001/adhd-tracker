// flux-workout-service.ts
// The write path. Everything a user action triggers — logging a workout,
// applying tags, awarding bucket drops — lives here. The pattern engine
// (read path) and this service (write path) deliberately don't share
// functions, so it's always clear which side of the system you're in.

import type { SQLiteDatabase } from 'expo-sqlite';
import type { WorkoutSource, DropResult } from './flux-types';
import { invalidatePatternCache } from './flux-pattern-engine';
import { addDrops } from './bucket_service';

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
// linking, bucket drops, and cache invalidation in the right order.
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
): Promise<{ workoutId: number; dropResult: DropResult }> {
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

  const uniqueTagIds = [...new Set(tagIds)];
  for (const tagId of uniqueTagIds) {
    await db.runAsync(
      `INSERT OR IGNORE INTO workout_tags (workout_id, tag_id) VALUES (?, ?)`,
      [workoutId, tagId]
    );
    await bumpTagUseCount(db, tagId);
  }

  const dropResult = await addDrops(db, {
    durationMinutes: workout.durationMinutes ?? null,
    moodAfter: workout.moodAfter ?? null,
  });

  await invalidatePatternCache(db);

  return { workoutId, dropResult };
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
