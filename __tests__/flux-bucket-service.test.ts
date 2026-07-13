// __tests__/flux-bucket-service.test.ts
//
// Covers the bucket mechanic: the drop formula, tier math, and the
// addDrops write path. The single most important invariant in the
// codebase — lifetime_drops only ever increases — is asserted here.

import type { SQLiteDatabase } from 'expo-sqlite';
import { createTestDb } from './flux-test-utils';
import { ensureBucketTable } from './flux-bucket-fixture';
import {
  calculateDrops,
  getTierInfo,
  getBucketState,
  addDrops,
} from '../lib/bucket_service';

describe('flux-bucket-service', () => {
  describe('calculateDrops', () => {
    it('returns the base 10 for null duration and null mood', () => {
      expect(calculateDrops(null, null)).toBe(10);
    });

    describe('duration bonus brackets (mood held null)', () => {
      it('null duration → +0', () => {
        expect(calculateDrops(null, null)).toBe(10);
      });

      it('0–10 min → +0 (boundary: 0, 10)', () => {
        expect(calculateDrops(0, null)).toBe(10);
        expect(calculateDrops(10, null)).toBe(10);
      });

      it('11–20 min → +3 (boundary: 11, 20)', () => {
        expect(calculateDrops(11, null)).toBe(13);
        expect(calculateDrops(20, null)).toBe(13);
      });

      it('21–30 min → +7 (boundary: 21, 30)', () => {
        expect(calculateDrops(21, null)).toBe(17);
        expect(calculateDrops(30, null)).toBe(17);
      });

      it('31–45 min → +12 (boundary: 31, 45)', () => {
        expect(calculateDrops(31, null)).toBe(22);
        expect(calculateDrops(45, null)).toBe(22);
      });

      it('46–60 min → +18 (boundary: 46, 60)', () => {
        expect(calculateDrops(46, null)).toBe(28);
        expect(calculateDrops(60, null)).toBe(28);
      });

      it('>60 min → +25 (boundary: 61)', () => {
        expect(calculateDrops(61, null)).toBe(35);
        expect(calculateDrops(120, null)).toBe(35);
      });
    });

    describe('effort bonus per mood_after (duration held null)', () => {
      it('null mood → +0', () => {
        expect(calculateDrops(null, null)).toBe(10);
      });

      it('mood 1 → +0', () => {
        expect(calculateDrops(null, 1)).toBe(10);
      });

      it('mood 2 → +0', () => {
        expect(calculateDrops(null, 2)).toBe(10);
      });

      it('mood 3 → +3', () => {
        expect(calculateDrops(null, 3)).toBe(13);
      });

      it('mood 4 → +7', () => {
        expect(calculateDrops(null, 4)).toBe(17);
      });

      it('mood 5 → +12', () => {
        expect(calculateDrops(null, 5)).toBe(22);
      });
    });

    it('caps at the maximum possible session: 60+ min with mood 5 = 47', () => {
      expect(calculateDrops(61, 5)).toBe(47);
      expect(calculateDrops(999, 5)).toBe(47);
    });
  });

  describe('getTierInfo', () => {
    it('0 drops → Pail at fillPct 0', () => {
      const info = getTierInfo(0);
      expect(info.tier).toBe(1);
      expect(info.name).toBe('Pail');
      expect(info.fillPct).toBe(0);
      expect(info.tierStart).toBe(0);
      expect(info.dropsToNext).toBe(100);
    });

    it('99 drops → Pail at fillPct 99', () => {
      const info = getTierInfo(99);
      expect(info.name).toBe('Pail');
      expect(info.fillPct).toBe(99);
      expect(info.dropsToNext).toBe(1);
    });

    it('100 drops → Bucket at fillPct 0', () => {
      const info = getTierInfo(100);
      expect(info.tier).toBe(2);
      expect(info.name).toBe('Bucket');
      expect(info.fillPct).toBe(0);
      expect(info.tierStart).toBe(100);
      expect(info.dropsToNext).toBe(200);
    });

    it('300 drops → Barrel at fillPct 0', () => {
      const info = getTierInfo(300);
      expect(info.tier).toBe(3);
      expect(info.name).toBe('Barrel');
      expect(info.fillPct).toBe(0);
      expect(info.tierStart).toBe(300);
      expect(info.dropsToNext).toBe(300);
    });

    it('1100 drops → Reservoir with no next tier', () => {
      const info = getTierInfo(1100);
      expect(info.tier).toBe(5);
      expect(info.name).toBe('Reservoir');
      expect(info.fillPct).toBe(0);
      expect(info.dropsToNext).toBeNull();
      expect(info.tierStart).toBe(1100);
    });
  });

  describe('DB functions', () => {
    let db: SQLiteDatabase;

    beforeEach(async () => {
      db = createTestDb();
      await ensureBucketTable(db);
    });

    describe('getBucketState', () => {
      it('reads the seeded singleton row', async () => {
        const state = await getBucketState(db);
        expect(state.lifetimeDrops).toBe(0);
        expect(state.currentTier).toBe(1);
        expect(state.totalWorkouts).toBe(0);
        expect(state.lastWorkoutDate).toBeNull();
      });
    });

    describe('addDrops', () => {
      it('increases lifetime_drops by exactly the calculated amount', async () => {
        // 30 min (+7) with mood 4 (+7) = 24 drops
        const result = await addDrops(db, { durationMinutes: 30, moodAfter: 4 });
        expect(result.dropsEarned).toBe(24);
        expect(result.newTotal).toBe(24);

        const state = await getBucketState(db);
        expect(state.lifetimeDrops).toBe(24);
        expect(state.totalWorkouts).toBe(1);
        expect(state.lastWorkoutDate).not.toBeNull();
      });

      it('counts both sessions when called twice on the same day — no date dedup', async () => {
        await addDrops(db, { durationMinutes: 30, moodAfter: 4 }); // 24
        await addDrops(db, { durationMinutes: 30, moodAfter: 4 }); // 24

        const state = await getBucketState(db);
        expect(state.lifetimeDrops).toBe(48);
        expect(state.totalWorkouts).toBe(2);
      });

      it.each([
        [100, 2, 'Bucket'],
        [300, 3, 'Barrel'],
        [600, 4, 'Trough'],
        [1100, 5, 'Reservoir'],
      ])(
        'reports tierAdvanced when crossing %i drops into tier %i (%s)',
        async (threshold, expectedTier, expectedName) => {
          // Park lifetime_drops just below the threshold, then add a session
          // that pushes it across.
          await db.runAsync(
            `UPDATE bucket SET lifetime_drops = ?, current_tier = ? WHERE id = 1`,
            [threshold - 5, getTierInfo(threshold - 5).tier]
          );

          const result = await addDrops(db, { durationMinutes: 30, moodAfter: 4 }); // +24
          expect(result.tierAdvanced).toBe(true);
          expect(result.newTier).toBeDefined();
          expect(result.newTier!.tier).toBe(expectedTier);
          expect(result.newTier!.name).toBe(expectedName);

          const state = await getBucketState(db);
          expect(state.currentTier).toBe(expectedTier);
        }
      );

      it('does not report tierAdvanced when staying inside the same tier', async () => {
        const result = await addDrops(db, { durationMinutes: 10, moodAfter: 1 }); // +10
        expect(result.tierAdvanced).toBe(false);
        expect(result.newTier).toBeUndefined();
      });

      it.each([
        [null, null],
        [0, null],
        [-30, null],
        [-999, 1],
        [0, 2],
      ])(
        'never decreases lifetime_drops (duration %p, mood %p)',
        async (durationMinutes, moodAfter) => {
          await db.runAsync(`UPDATE bucket SET lifetime_drops = 500 WHERE id = 1`);

          const result = await addDrops(db, { durationMinutes, moodAfter });
          expect(result.dropsEarned).toBeGreaterThanOrEqual(10);

          const state = await getBucketState(db);
          expect(state.lifetimeDrops).toBeGreaterThanOrEqual(500);
          expect(state.lifetimeDrops).toBe(500 + result.dropsEarned);
        }
      );
    });
  });
});
