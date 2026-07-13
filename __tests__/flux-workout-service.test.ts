// __tests__/flux-workout-service.test.ts
//
// Covers the write path: check-in logging, tag promotion, and the
// logWorkoutWithTags orchestration function (workout insert, tag
// linking, bucket drops, and cache invalidation).

import type { SQLiteDatabase } from 'expo-sqlite';
import { createTestDb, daysAgo } from './flux-test-utils';
import { ensureBucketTable } from './flux-bucket-fixture';
import {
  logCheckIn,
  logWorkoutWithTags,
  getOrCreateTag,
  getQuickAccessTags,
} from '../lib/flux-workout-service';

describe('flux-workout-service', () => {
  let db: SQLiteDatabase;

  beforeEach(async () => {
    db = createTestDb();
    await ensureBucketTable(db);
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
      const { workoutId } = await logWorkoutWithTags(
        db,
        { date: daysAgo(0), activityType: 'lift' },
        [tagId, tagId] // e.g. a double-tap bug upstream in the UI
      );

      const links = await db.getAllAsync<any>(
        `SELECT * FROM workout_tags WHERE workout_id = ?`,
        [workoutId]
      );
      expect(links).toHaveLength(1);
    });

    it('dedupes duplicate tag ids before bumping use_count, so a double-tap only counts once', async () => {
      const tagId = await getOrCreateTag(db, 'Deduped tag');
      await logWorkoutWithTags(
        db,
        { date: daysAgo(0), activityType: 'lift' },
        [tagId, tagId]
      );

      const tagRow = await db.getFirstAsync<any>(`SELECT use_count FROM tags WHERE id = ?`, [tagId]);
      expect(tagRow.use_count).toBe(1);
    });

    it('returns the workoutId and a dropResult from the bucket service', async () => {
      const result = await logWorkoutWithTags(
        db,
        { date: daysAgo(0), activityType: 'walk', durationMinutes: 25, moodAfter: 4 },
        []
      );

      expect(typeof result.workoutId).toBe('number');
      expect(result.dropResult).toBeDefined();
      expect(result.dropResult.dropsEarned).toBeGreaterThan(0);
    });

    it('increases the bucket lifetime_drops when a workout is logged', async () => {
      const before = await db.getFirstAsync<any>(`SELECT lifetime_drops FROM bucket WHERE id = 1`);

      await logWorkoutWithTags(
        db,
        { date: daysAgo(0), activityType: 'walk', durationMinutes: 25, moodAfter: 4 },
        []
      );

      const after = await db.getFirstAsync<any>(`SELECT lifetime_drops FROM bucket WHERE id = 1`);
      expect(after.lifetime_drops).toBeGreaterThan(before.lifetime_drops);
    });
  });
});
