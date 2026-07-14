import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useDatabaseContext } from './DatabaseContext';

export interface SettingsContextValue {
  settings: Record<string, string>; // all rows from settings table
  loading: boolean;
  setSetting: (key: string, value: string) => Promise<void>; // upsert DB + update state
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const db = useDatabaseContext();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await db.getAllAsync<{ key: string; value: string }>(
        'SELECT key, value FROM settings'
      );
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const row of rows) next[row.key] = row.value;
      setSettings(next);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [db]);

  const setSetting = useCallback(
    async (key: string, value: string) => {
      await db.runAsync(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        [key, value]
      );
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [db]
  );

  return (
    <SettingsContext.Provider value={{ settings, loading, setSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
