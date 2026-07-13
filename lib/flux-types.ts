// flux-types.ts
// Shared types matching the SQLite schema 1:1. Keeping these in one place
// means the pattern engine, the workout service, and the UI components
// all agree on shape — no silent drift between what the DB stores and
// what the app expects.

export type Sentiment = 'positive' | 'negative' | 'neutral';
export type TagCategory = 'nutrition' | 'effort' | 'mental' | 'environment' | 'custom';
export type WorkoutSource = 'manual' | 'healthkit' | 'health_connect';

export interface CheckIn {
  id: number;
  date: string; // ISO date, e.g. "2026-06-26"
  energyLevel: number; // 1–5
  mood: number; // 1–5
  sleepQuality: number | null; // 1–3
  stressLevel: number | null; // 1–3
  medicationTaken: boolean | null;
  createdAt: string;
}

export interface Workout {
  id: number;
  date: string;
  startedAt: string | null;
  durationMinutes: number | null;
  activityType: string;
  moodAfter: number | null; // 1–5
  notes: string | null;
  source: WorkoutSource;
  externalId: string | null;
  createdAt: string;
}

export interface Tag {
  id: number;
  label: string;
  category: TagCategory;
  sentiment: Sentiment;
  isPreset: boolean;
  useCount: number;
  createdAt: string;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  restDaysBanked: number;
  totalWorkouts: number;
}

// ---- Pattern engine result shapes ----
// These are the JSON payloads stored in patterns_cache.data and what the
// insights screen actually renders.

export interface EnergyRhythmDay {
  day: string; // "Mon", "Tue", ...
  avgEnergy: number;
  samples: number;
}

export interface EnergyRhythmResult {
  byDay: EnergyRhythmDay[];
  lowestDay: EnergyRhythmDay | null;
  highestDay: EnergyRhythmDay | null;
}

export interface TagMoodCorrelationRow {
  label: string;
  sentiment: Sentiment;
  avgMood: number;
  sessions: number;
}

export interface BurnoutPrecursorResult {
  currentWeekCount: number;
  fourWeekAverage: number;
  isElevated: boolean;
}

export interface HydrationInsightResult {
  hasEnoughData: boolean;
  hydratedAvgMood?: number;
  dehydratedAvgMood?: number;
  difference?: number;
}

export type PatternType =
  | 'day_energy_rhythm'
  | 'tag_mood_correlation'
  | 'burnout_precursor'
  | 'hydration_insight';

export interface PatternResult<T = unknown> {
  patternType: PatternType;
  data: T;
  computedAt: string;
  isStale: boolean;
  validUntil: string | null;
}
