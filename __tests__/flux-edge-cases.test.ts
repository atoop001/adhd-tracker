// __tests__/flux-edge-cases.test.ts
//
// Edge-case coverage for paths the Layer 1 reviews flagged as untested:
// out-of-range mood/duration inputs to the drop formula, tier-name
// clamping, corrupted entitlement values (default-open behavior), and
// malformed reminder times (which must bail before any native import).

import type { SQLiteDatabase } from 'expo-sqlite';
import { createTestDb, daysAgo } from './flux-test-utils';
import { ensureBucketTable } from './flux-bucket-fixture';
import { calculateDrops, getTierName } from '../lib/bucket_service';
import { getEntitlement, setDevEntitlement } from '../lib/flux-purchases';
import { scheduleCheckInReminder } from '../lib/flux-notifications';
import { logWorkoutWithTags } from '../lib/flux-workout-service';

describe('flux edge cases', () => {
  let db: SQLiteDatabase;

  beforeEach(async () => {
    db = createTestDb();
    await ensureBucketTable(db);
  });

  describe('calculateDrops input hardening', () => {
    it('ignores out-of-range moods — no effort bonus, base still earned', () => {
      expect(calculateDrops(null, 0)).toBe(10);
      expect(calculateDrops(null, 6)).toBe(10);
      expect(calculateDrops(null, 99)).toBe(10);
      expect(calculateDrops(null, -1)).toBe(10);
    });

    it('ignores zero, negative, and null durations — base still earned', () => {
      expect(calculateDrops(0, null)).toBe(10);
      expect(calculateDrops(-30, null)).toBe(10);
      expect(calculateDrops(null, null)).toBe(10);
    });

    it('caps at 47 for any marathon session', () => {
      expect(calculateDrops(61, 5)).toBe(47);
      expect(calculateDrops(10000, 5)).toBe(47);
    });

    it('applies duration bonuses on the documented boundaries', () => {
      expect(calculateDrops(10, null)).toBe(10); // 0–10 → 0
      expect(calculateDrops(11, null)).toBe(13); // 11–20 → 3
      expect(calculateDrops(20, null)).toBe(13);
      expect(calculateDrops(21, null)).toBe(17); // 21–30 → 7
      expect(calculateDrops(30, null)).toBe(17);
      expect(calculateDrops(31, null)).toBe(22); // 31–45 → 12
      expect(calculateDrops(45, null)).toBe(22);
      expect(calculateDrops(46, null)).toBe(28); // 46–60 → 18
      expect(calculateDrops(60, null)).toBe(28);
      expect(calculateDrops(61, null)).toBe(35); // 60+ → 25
    });
  });

  describe('getTierName clamping', () => {
    it('resolves real tiers by number', () => {
      expect(getTierName(1)).toBe('Pail');
      expect(getTierName(5)).toBe('Reservoir');
    });

    it('clamps out-of-range tiers to the nearest real one', () => {
      expect(getTierName(0)).toBe('Pail');
      expect(getTierName(-3)).toBe('Pail');
      expect(getTierName(6)).toBe('Reservoir'); // "tier + 1" at the top end
    });
  });

  describe('getEntitlement default-open behavior', () => {
    it("resolves 'full' when the key is missing", async () => {
      expect(await getEntitlement(db)).toBe('full');
    });

    it("resolves 'free' only for the literal 'false'", async () => {
      await setDevEntitlement(db, 'free');
      expect(await getEntitlement(db)).toBe('free');
    });

    it("resolves 'full' for corrupted values — default-open, never lock out", async () => {
      for (const corrupted of ['banana', '', '0', 'FALSE']) {
        await db.runAsync(
          `INSERT INTO settings (key, value) VALUES ('dev_full_access', ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
          [corrupted]
        );
        expect(await getEntitlement(db)).toBe('full');
      }
    });
  });

  describe('scheduleCheckInReminder with malformed times', () => {
    it.each(['25:00', '12:60', 'abc', '8:5', ''])(
      'bails silently on %j without storing a notification id',
      async (bad) => {
        await expect(scheduleCheckInReminder(db, bad)).resolves.toBeUndefined();
        const row = await db.getFirstAsync<{ value: string }>(
          `SELECT value FROM settings WHERE key = 'checkin_notification_id'`
        );
        expect(row).toBeFalsy();
      }
    );
  });

  describe('logWorkoutWithTags with out-of-range mood', () => {
    it('is rejected by the schema CHECK constraint with no partial write', async () => {
      const before = await db.getFirstAsync<{ lifetime_drops: number }>(
        `SELECT lifetime_drops FROM bucket WHERE id = 1`
      );

      await expect(
        logWorkoutWithTags(
          db,
          { date: daysAgo(0), activityType: 'walk', durationMinutes: 25, moodAfter: 99 },
          []
        )
      ).rejects.toThrow(/mood_after/);

      // The insert failed first, so nothing downstream ran: no workout row,
      // no drops added.
      const workouts = await db.getAllAsync(`SELECT id FROM workouts`);
      expect(workouts).toHaveLength(0);

      const after = await db.getFirstAsync<{ lifetime_drops: number }>(
        `SELECT lifetime_drops FROM bucket WHERE id = 1`
      );
      expect(after!.lifetime_drops).toBe(before!.lifetime_drops);
    });
  });
});
