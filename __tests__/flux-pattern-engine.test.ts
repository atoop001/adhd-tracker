// __tests__/flux-pattern-engine.test.ts
//
// Covers the read path: cache hit/miss/invalidate behavior, and the four
// insight computations — energy rhythm, tag-mood correlation, burnout
// precursor, and hydration. All run against an in-memory SQLite DB, no
// mocking of the actual SQL — these are the real queries.

import type { SQLiteDatabase } from 'expo-sqlite';
import { createTestDb, daysAgo, weekdayLabel, seedTag, seedWorkout, tagWorkout } from './flux-test-utils';
import { getPattern, invalidatePatternCache } from '../lib/flux-pattern-engine';
import { logCheckIn } from '../lib/flux-workout-service';
import type {
  EnergyRhythmResult,
  TagMoodCorrelationRow,
  BurnoutPrecursorResult,
  HydrationInsightResult,
} from '../lib/flux-types';

describe('flux-pattern-engine', () => {
  let db: SQLiteDatabase;

  beforeEach(() => {
    db = createTestDb();
  });

  describe('caching behavior', () => {
    it('computes and caches a pattern on first request', async () => {
      const result = await getPattern<EnergyRhythmResult>(db, 'day_energy_rhythm');
      expect(result.isStale).toBe(false);

      const cached = await db.getFirstAsync<any>(
        `SELECT * FROM patterns_cache WHERE pattern_type = 'day_energy_rhythm'`
      );
      expect(cached).toBeTruthy();
      expect(cached.is_stale).toBe(0);
    });

    it('returns the cached value and does not reflect new data until invalidated', async () => {
      const before = await getPattern<EnergyRhythmResult>(db, 'day_energy_rhythm');
      expect(before.data.byDay).toHaveLength(0);

      // New data arrives, but nothing has invalidated the cache yet.
      await db.runAsync(`INSERT INTO check_ins (date, energy_level, mood) VALUES (?, 5, 5)`, [
        daysAgo(0),
      ]);

      const stillCached = await getPattern<EnergyRhythmResult>(db, 'day_energy_rhythm');
      expect(stillCached.data.byDay).toHaveLength(0); // unchanged — proves caching works
    });

    it('recomputes and reflects new data once invalidatePatternCache runs', async () => {
      await getPattern<EnergyRhythmResult>(db, 'day_energy_rhythm');
      await db.runAsync(`INSERT INTO check_ins (date, energy_level, mood) VALUES (?, 5, 5)`, [
        daysAgo(0),
      ]);

      await invalidatePatternCache(db);
      const fresh = await getPattern<EnergyRhythmResult>(db, 'day_energy_rhythm');
      expect(fresh.data.byDay.length).toBeGreaterThan(0);
    });
  });

  describe('day_energy_rhythm', () => {
    it('requires 3+ samples to trust a day average, but still reports lower-confidence days', async () => {
      const wLow = weekdayLabel(daysAgo(0));

      // 3 samples on today's weekday — energy 2, 2, 3 → avg 2.3, reliable.
      await logCheckIn(db, { date: daysAgo(0), energyLevel: 2, mood: 3 });
      await logCheckIn(db, { date: daysAgo(7), energyLevel: 2, mood: 3 });
      await logCheckIn(db, { date: daysAgo(14), energyLevel: 3, mood: 3 });

      // Only 2 samples on a different weekday — avg 5, NOT reliable.
      await logCheckIn(db, { date: daysAgo(1), energyLevel: 5, mood: 5 });
      await logCheckIn(db, { date: daysAgo(8), energyLevel: 5, mood: 5 });

      // 3 samples on a third weekday — energy 4, 5, 5 → avg 4.7, reliable.
      await logCheckIn(db, { date: daysAgo(2), energyLevel: 4, mood: 4 });
      await logCheckIn(db, { date: daysAgo(9), energyLevel: 5, mood: 4 });
      await logCheckIn(db, { date: daysAgo(16), energyLevel: 5, mood: 4 });

      const result = await getPattern<EnergyRhythmResult>(db, 'day_energy_rhythm');

      const lowDayEntry = result.data.byDay.find((d) => d.day === wLow);
      expect(lowDayEntry?.avgEnergy).toBeCloseTo(2.3, 1);
      expect(lowDayEntry?.samples).toBe(3);

      expect(result.data.lowestDay?.day).toBe(wLow);
      expect(result.data.highestDay?.avgEnergy).toBeCloseTo(4.7, 1);
      expect(result.data.highestDay?.samples).toBeGreaterThanOrEqual(3);
    });
  });

  describe('tag_mood_correlation', () => {
    it('correlates tag sentiment with avg mood_after, excluding tags seen fewer than 2x', async () => {
      const hydrated = await seedTag(db, 'Well hydrated', 'positive', 'nutrition');
      const distracted = await seedTag(db, 'Distracted', 'negative', 'mental');

      const w1 = await seedWorkout(db, daysAgo(1), 4);
      const w2 = await seedWorkout(db, daysAgo(2), 5);
      await tagWorkout(db, w1, hydrated);
      await tagWorkout(db, w2, hydrated);

      const w3 = await seedWorkout(db, daysAgo(3), 2);
      await tagWorkout(db, w3, distracted); // only 1 session — excluded by HAVING

      const result = await getPattern<TagMoodCorrelationRow[]>(db, 'tag_mood_correlation');

      const hydratedRow = result.data.find((r) => r.label === 'Well hydrated');
      expect(hydratedRow?.avgMood).toBeCloseTo(4.5, 1);
      expect(hydratedRow?.sessions).toBe(2);

      const distractedRow = result.data.find((r) => r.label === 'Distracted');
      expect(distractedRow).toBeUndefined();
    });
  });

  describe('burnout_precursor', () => {
    it('flags an elevated week when negative tags spike well above the trailing baseline', async () => {
      const negTag = await seedTag(db, 'Went out too hard', 'negative', 'effort');

      // Sparse trailing history over the prior weeks → low baseline.
      for (const offset of [10, 20, 30]) {
        const w = await seedWorkout(db, daysAgo(offset), 3);
        await tagWorkout(db, w, negTag);
      }

      // A clear spike in the current 7-day window.
      for (const offset of [1, 2, 3, 4, 5]) {
        const w = await seedWorkout(db, daysAgo(offset), 2);
        await tagWorkout(db, w, negTag);
      }

      const result = await getPattern<BurnoutPrecursorResult>(db, 'burnout_precursor');
      expect(result.data.currentWeekCount).toBe(5);
      expect(result.data.isElevated).toBe(true);
    });

    it('does not flag elevation when there is no meaningful baseline yet', async () => {
      const negTag = await seedTag(db, 'Anxious before starting', 'negative', 'mental');
      const w = await seedWorkout(db, daysAgo(1), 3);
      await tagWorkout(db, w, negTag);

      const result = await getPattern<BurnoutPrecursorResult>(db, 'burnout_precursor');
      expect(result.data.isElevated).toBe(false);
    });
  });

  describe('hydration_insight', () => {
    it('withholds the insight until both sides have enough sessions', async () => {
      const hydrated = await seedTag(db, 'Well hydrated', 'positive', 'nutrition');
      const w = await seedWorkout(db, daysAgo(1), 5);
      await tagWorkout(db, w, hydrated);

      const result = await getPattern<HydrationInsightResult>(db, 'hydration_insight');
      expect(result.data.hasEnoughData).toBe(false);
    });

    it('computes the mood difference once both sides clear the sample threshold', async () => {
      const hydrated = await seedTag(db, 'Well hydrated', 'positive', 'nutrition');
      const dehydrated = await seedTag(db, 'Not enough water', 'negative', 'nutrition');

      for (const [offset, mood] of [[1, 5], [2, 4], [3, 5]] as const) {
        const w = await seedWorkout(db, daysAgo(offset), mood);
        await tagWorkout(db, w, hydrated);
      }
      for (const [offset, mood] of [[10, 2], [11, 3]] as const) {
        const w = await seedWorkout(db, daysAgo(offset), mood);
        await tagWorkout(db, w, dehydrated);
      }

      const result = await getPattern<HydrationInsightResult>(db, 'hydration_insight');
      expect(result.data.hasEnoughData).toBe(true);
      expect(result.data.hydratedAvgMood).toBeCloseTo(4.7, 1);
      expect(result.data.dehydratedAvgMood).toBeCloseTo(2.5, 1);
      expect(result.data.difference).toBeCloseTo(2.2, 1);
    });
  });
});
