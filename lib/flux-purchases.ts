// lib/flux-purchases.ts
//
// This module is the single seam where react-native-purchases (RevenueCat)
// gets wired in later. RevenueCat is NOT integrated yet — there is no
// account to authenticate against — so this is a local stub backed by the
// `settings` table. Keep these three function signatures stable; when the
// real SDK lands, only the bodies change.
//
// Default entitlement is FULL: a missing (or 'true') dev_full_access key
// resolves to 'full' so every screen is usable in Expo Go during Layer 1
// development. The Settings dev toggle (later task) calls setDevEntitlement
// to flip this to 'free' for testing the paywall path.

import type { SQLiteDatabase } from 'expo-sqlite';

export type EntitlementTier = 'free' | 'full';

const DEV_ENTITLEMENT_KEY = 'dev_full_access';

/** Reads settings key 'dev_full_access'. Missing key or 'true' -> 'full';
 *  'false' -> 'free'. */
export async function getEntitlement(db: SQLiteDatabase): Promise<EntitlementTier> {
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = ?`,
    [DEV_ENTITLEMENT_KEY]
  );
  if (!row) return 'full';
  return row.value === 'false' ? 'free' : 'full';
}

/** Dev-only override used by the Settings dev toggle. Upserts the settings row. */
export async function setDevEntitlement(
  db: SQLiteDatabase,
  tier: EntitlementTier
): Promise<void> {
  const value = tier === 'full' ? 'true' : 'false';
  await db.runAsync(
    `INSERT INTO settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
    [DEV_ENTITLEMENT_KEY, value]
  );
}

/** Stub purchase flow: sets dev_full_access='true' and resolves. Real
 *  RevenueCat purchase call replaces this body later. */
export async function purchaseFull(db: SQLiteDatabase): Promise<EntitlementTier> {
  await setDevEntitlement(db, 'full');
  return 'full';
}
