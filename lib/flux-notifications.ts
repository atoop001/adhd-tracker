// lib/flux-notifications.ts
//
// Local check-in reminder notifications. Local-only — no push, no network,
// no remote anything. This module is imported by screens (never by tested
// services), so it must be free of side effects at import time: no
// top-level Notifications.* calls, no handler registration at module scope.
// All expo-notifications calls happen inside the exported functions.

import type { SQLiteDatabase } from 'expo-sqlite';

const LAST_COPY_INDEX_KEY = 'last_notification_copy';
const NOTIFICATION_ID_KEY = 'checkin_notification_id';

const REMINDER_COPY = [
  'Time to check in with Flux ⚡',
  "How's your energy today?",
  'Quick check-in — 5 seconds',
  'Your bucket is waiting 💧',
] as const;

async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = ?`,
    [key]
  );
  return row ? row.value : null;
}

async function setSetting(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
    [key, value]
  );
}

/** Picks a copy index different from the last-used one (persisted in
 *  settings), so the same message never repeats back-to-back. */
async function pickNextCopyIndex(db: SQLiteDatabase): Promise<number> {
  const lastRaw = await getSetting(db, LAST_COPY_INDEX_KEY);
  const lastIndex = lastRaw !== null ? parseInt(lastRaw, 10) : -1;

  let nextIndex = Math.floor(Math.random() * REMINDER_COPY.length);
  if (REMINDER_COPY.length > 1) {
    while (nextIndex === lastIndex) {
      nextIndex = Math.floor(Math.random() * REMINDER_COPY.length);
    }
  }

  await setSetting(db, LAST_COPY_INDEX_KEY, String(nextIndex));
  return nextIndex;
}

/** Parses a "HH:MM" string into hour/minute. Returns null if malformed or
 *  out of range. */
function parseTime(time: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/** Requests permission if needed, cancels any existing reminder, then
 *  schedules a daily repeating local notification at the given "HH:MM"
 *  time. Bails silently (no throw) if permission is denied or the time is
 *  malformed — no guilt, no error surfaced to the user. */
export async function scheduleCheckInReminder(db: SQLiteDatabase, time: string): Promise<void> {
  const parsed = parseTime(time);
  if (!parsed) return;

  const Notifications = await import('expo-notifications');

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.granted;
  }
  if (!granted) return;

  await cancelCheckInReminder(db);

  const copyIndex = await pickNextCopyIndex(db);
  const body = REMINDER_COPY[copyIndex];

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Flux',
      body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: parsed.hour,
      minute: parsed.minute,
    },
  });

  await setSetting(db, NOTIFICATION_ID_KEY, identifier);
}

/** Cancels the precise scheduled reminder using the stored notification id.
 *  Safe no-op if no id was ever stored. */
export async function cancelCheckInReminder(db: SQLiteDatabase): Promise<void> {
  const id = await getSetting(db, NOTIFICATION_ID_KEY);
  if (!id) return;

  const Notifications = await import('expo-notifications');
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Notification may already be gone (delivered, cleared by the OS,
    // app reinstalled). Cancelling is best-effort — never throw.
  }

  await db.runAsync(`DELETE FROM settings WHERE key = ?`, [NOTIFICATION_ID_KEY]);
}
