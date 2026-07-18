// lib/bucket_service.ts
//
// The bucket mechanic: a permanent accumulator that replaces streaks.
// lifetime_drops only ever increases — the single most important
// invariant in the codebase. Every path through addDrops adds at least
// the base 10 drops; nothing here (or anywhere) subtracts.

import type { SQLiteDatabase } from 'expo-sqlite';
import type { BucketState, TierInfo, DropResult } from './flux-types';

const BASE_DROPS = 10;

const TIERS = [
  { tier: 1, name: 'Pail',      start: 0,    size: 100 },
  { tier: 2, name: 'Bucket',    start: 100,  size: 200 },
  { tier: 3, name: 'Barrel',    start: 300,  size: 300 },
  { tier: 4, name: 'Trough',    start: 600,  size: 500 },
  { tier: 5, name: 'Reservoir', start: 1100, size: Infinity },
] as const;

/** Name of a tier by its 1-based number; out-of-range clamps to the
 *  nearest real tier so callers can ask for "tier + 1" at the top end. */
export function getTierName(tier: number): TierInfo['name'] {
  const clamped = Math.min(Math.max(tier, TIERS[0].tier), TIERS[TIERS.length - 1].tier);
  return TIERS[clamped - 1].name;
}

/** drops = base(10) + duration_bonus + effort_bonus. Never negative,
 *  never less than the base — garbage input still earns the base 10. */
export function calculateDrops(
  durationMinutes: number | null,
  moodAfter: number | null
): number {
  let durationBonus = 0;
  if (durationMinutes !== null && durationMinutes > 10) {
    if (durationMinutes <= 20) durationBonus = 3;
    else if (durationMinutes <= 30) durationBonus = 7;
    else if (durationMinutes <= 45) durationBonus = 12;
    else if (durationMinutes <= 60) durationBonus = 18;
    else durationBonus = 25;
  }

  let effortBonus = 0;
  if (moodAfter === 3) effortBonus = 3;
  else if (moodAfter === 4) effortBonus = 7;
  else if (moodAfter === 5) effortBonus = 12;

  return BASE_DROPS + durationBonus + effortBonus;
}

/** Resolve the tier a lifetime-drop total sits in, with fill progress
 *  toward the next tier. Reservoir is terminal: fillPct 0, no next. */
export function getTierInfo(lifetimeDrops: number): TierInfo {
  let current: (typeof TIERS)[number] = TIERS[0];
  for (const t of TIERS) {
    if (lifetimeDrops >= t.start) current = t;
  }

  const isTerminal = !Number.isFinite(current.size);
  const rawPct = isTerminal
    ? 0
    : ((lifetimeDrops - current.start) / current.size) * 100;
  const fillPct = Math.min(100, Math.max(0, rawPct));

  const dropsToNext = isTerminal
    ? null
    : current.start + current.size - lifetimeDrops;

  return {
    tier: current.tier,
    name: current.name,
    fillPct,
    dropsToNext,
    tierStart: current.start,
  };
}

interface BucketRow {
  lifetime_drops: number;
  current_tier: number;
  total_workouts: number;
  last_workout_date: string | null;
}

/** Read the singleton bucket row (id = 1, always exists via seed). */
export async function getBucketState(db: SQLiteDatabase): Promise<BucketState> {
  const row = await db.getFirstAsync<BucketRow>(
    `SELECT lifetime_drops, current_tier, total_workouts, last_workout_date
       FROM bucket WHERE id = 1`
  );
  if (!row) {
    throw new Error('Bucket row missing — the id=1 seed row must always exist');
  }
  return {
    lifetimeDrops: row.lifetime_drops,
    currentTier: row.current_tier,
    totalWorkouts: row.total_workouts,
    lastWorkoutDate: row.last_workout_date,
  };
}

/** Award drops for a workout session. Additive only — lifetime_drops
 *  never decreases under any input. */
export async function addDrops(
  db: SQLiteDatabase,
  workout: { durationMinutes: number | null; moodAfter: number | null }
): Promise<DropResult> {
  const dropsEarned = calculateDrops(workout.durationMinutes, workout.moodAfter);

  const before = await db.getFirstAsync<{ current_tier: number }>(
    `SELECT current_tier FROM bucket WHERE id = 1`
  );

  await db.runAsync(
    `UPDATE bucket
        SET lifetime_drops   = lifetime_drops + ?,
            total_workouts   = total_workouts + 1,
            last_workout_date = date('now'),
            updated_at       = CURRENT_TIMESTAMP
      WHERE id = 1`,
    [dropsEarned]
  );

  const after = await db.getFirstAsync<{ lifetime_drops: number }>(
    `SELECT lifetime_drops FROM bucket WHERE id = 1`
  );
  const newTotal = after?.lifetime_drops ?? dropsEarned;

  const tierInfo = getTierInfo(newTotal);
  const tierAdvanced = before != null && tierInfo.tier !== before.current_tier;

  if (tierAdvanced) {
    await db.runAsync(`UPDATE bucket SET current_tier = ? WHERE id = 1`, [
      tierInfo.tier,
    ]);
  }

  const result: DropResult = { dropsEarned, newTotal, tierAdvanced };
  if (tierAdvanced) {
    result.newTier = tierInfo;
  }
  return result;
}
