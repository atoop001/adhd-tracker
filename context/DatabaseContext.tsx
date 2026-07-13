import React, { createContext, useContext, useEffect, useState } from 'react';
import { View } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '../lib/flux-db';

const DatabaseContext = createContext<SQLiteDatabase | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  useEffect(() => {
    getDb().then(setDb);
  }, []);

  if (!db) {
    return <View style={{ flex: 1, backgroundColor: '#0F0F14' }} />;
  }

  return (
    <DatabaseContext.Provider value={db}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabaseContext(): SQLiteDatabase {
  const db = useContext(DatabaseContext);
  if (!db) throw new Error('useDatabaseContext must be used within DatabaseProvider');
  return db;
}
