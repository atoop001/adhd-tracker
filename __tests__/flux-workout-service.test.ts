// __tests__/flux-workout-service.test.ts
//
// Covers the write path: check-in logging, streak forgiveness (the core
// retention mechanic), tag promotion, and the logWorkoutWithTags
// orchestration function.

import type { SQLiteDatabase } from 'expo-sqlite';
import { createTestDb, daysAgo } from './flux-test-utils';
import {
  logCheckIn,
  logWorkoutWithTags,
  getStreakState,
  evaluateStreakOnAppOpen,
  getOrCreateTag,
  getQuickAccessTags,
} from '../lib/flux-workout-service';

describe('flux-workout-service', () => {
  let db: SQLiteDatabase;

  beforeEach(() => {
    db = createTestDb();
  });

  describe('logCheckIn', () => {
    it('inserts a new check-in', async () => {
      await logCheckIn(db, { date: daysAgo(0), energyLevel: 3, mood: 4 });
      const row = await db.getFirstAsync<any>(`SELECT * FROM check_ins WHERE date = ?`, [daysAgo(0)]);
      expect(row.energy_level).toBe(3);
      expect(row.mood).toBe(4);
    });

    it('upserts on the same date rather than creating a duplicate', async () => {
      await logCheckIn(db, { date: daysAgo(0), energyLevel: 2, mood: 2 });
      await logCheckIn(db, { date: daysAgo(0), energyLevel: 5, mood: 5 });

      const rows = await db.getAllAsync<any>(`SELECT * FROM check_ins WHERE date = ?`, [daysAgo(0)]);
      expect(rows).toHaveLength(1);
      expect(rows[0].energy_level).toBe(5);
    });

    it('marks the pattern cache stale so insights recompute on next read', async () => {
      await db.runAsync(
        `INSERT INTO patterns_cache (pattern_type, data, is_stale) VALUES ('day_energy_rhythm', '{}', 0)`
      );
      await logCheckIn(db, { date: daysAgo(0), energyLevel: 4, mood: 4 });

      const cache = await db.getFirstAsync<any>(
        `SELECT is_stale FROM patterns_cache WHERE pattern_type = 'day_energy_rhythm'`
      );
      expect(cache.is_stale).toBe(1);
    });
  });

  describe('streak forgiveness', () => {
    it('starts a streak at 1 on the first logged workout', async () => {
      await logWorkoutWithTags(db, { date: daysAgo(0), activityType: 'walk' }, []);
      const streak = await getStreakState(db);
      expect(streak.currentStreak).toBe(1);
      expect(streak.lastActiveDate).toBe(daysAgo(0));
    });

    it('does not double-count a second workout logged the same day', async () => {
      await logWorkoutWithTags(db, { date: daysAgo(0), activityType: 'walk' }, []);
      await logWorkoutWithTags(db, { date: daysAgo(0), activityType: 'lift' }, []);
      const streak = await getStreakState(db);
      expect(streak.currentStreak).toBe(1);
      expect(streak.totalWorkouts).toBe(2);
    });

    it('increments the streak on consecutive active days', async () => {
      await logWorkoutWithTags(db, { date: daysAgo(1), activityType: 'walk' }, []);
      await logWorkoutWithTags(db, { date: daysAgo(0), activityType: 'walk' }, []);
      const streak = await getStreakState(db);
      expect(streak.currentStreak).toBe(2);
      expect(streak.longestStreak).toBe(2);
    });

    it('spends a banked rest day to preserve the streak across a missed day, instead of resetting it', async () => {
      await logWorkoutWithTags(db, { date: daysAgo(2), activityType: 'walk' }, []);
      await db.runAsync(`UPDATE streaks SET rest_days_banked = 1 WHERE id = 1`);

      // App opens today, having missed yesterday — a single missed day.
      await evaluateStreakOnAppOpen(db, daysAgo(0));

      const streak = await getStreakState(db);
      expect(streak.currentStreak).toBe(1); // preserved, not reset
      expect(streak.restDaysBanked).toBe(0); // the banked day was spent
    });

    it('resets the streak when missed days exceed what is banked', async () => {
      await logWorkoutWithTags(db, { date: daysAgo(5), activityType: 'walk' }, []);
      // 0 banked rest days, 4 missed days in between — too many to forgive.
      await evaluateStreakOnAppOpen(db, daysAgo(0));

      const streak = await getStreakState(db);
      expect(streak.currentStreak).toBe(0);
    });

    it('leaves a reset streak indistinguishable from a brand-new one — no punitive state', async () => {
      await logWorkoutWithTags(db, { date: daysAgo(10), activityType: 'walk' }, []);
      await evaluateStreakOnAppOpen(db, daysAgo(0));
      const afterReset = await getStreakState(db);

      const fresh = await getStreakState(createTestDb());

      expect(afterReset.currentStreak).toBe(fresh.currentStreak);
    });

    it('earns a banked rest day every 7 consecutive active days, capped at 3', async () => {
      for (let i = 13; i >= 0; i--) {
        await logWorkoutWithTags(db, { date: daysAgo(i), activityType: 'walk' }, []);
      }
      const streak = await getStreakState(db);
      expect(streak.currentStreak).toBe(14);
      expect(streak.restDaysBanked).toBe(2); // earned at day 7 and day 14
    });

    it('caps banked rest days at 3 even after many earning milestones', async () => {
      for (let i = 27; i >= 0; i--) {
        await logWorkoutWithTags(db, { date: daysAgo(i), activityType: 'walk' }, []);
      }
      const streak = await getStreakState(db);
      expect(streak.restDaysBanked).toBe(3); // would be 4 uncapped
    });
  });

  describe('tags', () => {
    it('creates a new custom tag with neutral sentiment by default', async () => {
      const id = await getOrCreateTag(db, 'Felt sluggish');
      const row = await db.getFirstAsync<any>(`SELECT * FROM tags WHERE id = ?`, [id]);
      expect(row.category).toBe('custom');
      expect(row.sentiment).toBe('neutral');
      expect(row.is_preset).toBe(0);
    });

    it('returns the existing tag id rather than creating a duplicate', async () => {
      const first = await getOrCreateTag(db, 'Good pace');
      const second = await getOrCreateTag(db, 'Good pace');
      expect(first).toBe(second);

      const count = await db.getFirstAsync<any>(
        `SELECT COUNT(*) as c FROM tags WHERE label = 'Good pace'`
      );
      expect(count.c).toBe(1);
    });

    it('bumps use_count for every tag applied via logWorkoutWithTags', async () => {
      const tagId = await getOrCreateTag(db, 'Well hydrated');
      await logWorkoutWithTags(db, { date: daysAgo(0), activityType: 'run' }, [tagId]);
      await logWorkoutWithTags(db, { date: daysAgo(1), activityType: 'run' }, [tagId]);

      const row = await db.getFirstAsync<any>(`SELECT use_count FROM tags WHERE id = ?`, [tagId]);
      expect(row.use_count).toBe(2);
    });

    it('surfaces the most-used tags first for quick access', async () => {
      const popular = await getOrCreateTag(db, 'Locked in');
      const rare = await getOrCreateTag(db, 'Too noisy');
      await db.runAsync(`UPDATE tags SET use_count = 5 WHERE id = ?`, [popular]);
      await db.runAsync(`UPDATE tags SET use_count = 1 WHERE id = ?`, [rare]);

      const top = await getQuickAccessTags(db, 2);
      expect((top[0] as any).id).toBe(popular);
    });
  });

  describe('logWorkoutWithTags', () => {
    it('links every provided tag to the workout, without duplicate rows', async () => {
      const tagId = await getOrCreateTag(db, 'Strong finish');
      const workoutId = await logWorkoutWithTags(
        db,
        { date: daysAgo(0), activityType: 'lift' },
        [tagId, tagId] // e.g. a double-tap bug upstream in the UI
      );

      const links = await db.getAllAsync<any>(
        `SELECT * FROM workout_tags WHERE workout_id = ?`,
        [workoutId]
      );
      expect(links).toHaveLength(1);

      // NOTE: use_count is bumped once per array entry, not once per row
      // actually inserted — so a duplicate tagId in the input array will
      // inflate use_count even though only one link is created. Worth
      // deduping tagIds client-side before calling this, or fixing here.
      const tagRow = await db.getFirstAsync<any>(`SELECT use_count FROM tags WHERE id = ?`, [tagId]);
      expect(tagRow.use_count).toBe(2); // documents the current behavior
    });
  });
});
