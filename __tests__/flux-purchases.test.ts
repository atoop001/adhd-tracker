// __tests__/flux-purchases.test.ts
//
// Covers the paywall stub's DB logic: entitlement defaults to 'full' when
// the dev_full_access key is missing (so every screen is usable in Expo Go
// with no RevenueCat account), the dev toggle can flip it to 'free', and
// the stub purchase flow always resolves to 'full'.

import type { SQLiteDatabase } from 'expo-sqlite';
import { createTestDb } from './flux-test-utils';
import { getEntitlement, setDevEntitlement, purchaseFull } from '../lib/flux-purchases';

describe('flux-purchases', () => {
  let db: SQLiteDatabase;

  beforeEach(() => {
    db = createTestDb();
  });

  describe('getEntitlement', () => {
    it('defaults to full when dev_full_access key is missing', async () => {
      expect(await getEntitlement(db)).toBe('full');
    });

    it('returns full when dev_full_access is "true"', async () => {
      await db.runAsync(
        `INSERT INTO settings (key, value) VALUES ('dev_full_access', 'true')`
      );
      expect(await getEntitlement(db)).toBe('full');
    });

    it('returns free when dev_full_access is "false"', async () => {
      await db.runAsync(
        `INSERT INTO settings (key, value) VALUES ('dev_full_access', 'false')`
      );
      expect(await getEntitlement(db)).toBe('free');
    });
  });

  describe('setDevEntitlement', () => {
    it('setting free then reading getEntitlement returns free', async () => {
      await setDevEntitlement(db, 'free');
      expect(await getEntitlement(db)).toBe('free');
    });

    it('setting full after free flips getEntitlement back to full', async () => {
      await setDevEntitlement(db, 'free');
      await setDevEntitlement(db, 'full');
      expect(await getEntitlement(db)).toBe('full');
    });

    it('upserts — calling twice does not throw and leaves one row', async () => {
      await setDevEntitlement(db, 'free');
      await setDevEntitlement(db, 'free');
      const rows = await db.getAllAsync(
        `SELECT * FROM settings WHERE key = 'dev_full_access'`
      );
      expect(rows.length).toBe(1);
    });
  });

  describe('purchaseFull', () => {
    it('sets dev_full_access to full and resolves "full"', async () => {
      await setDevEntitlement(db, 'free');
      const result = await purchaseFull(db);
      expect(result).toBe('full');
      expect(await getEntitlement(db)).toBe('full');
    });
  });
});
