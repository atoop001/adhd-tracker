import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, radii, spacing } from '../../constants/colors';
import { useDatabaseContext } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import { getBucketState } from '../../lib/bucket_service';
import { logCheckIn } from '../../lib/flux-workout-service';
import { getPattern } from '../../lib/flux-pattern-engine';
import type {
  BucketState,
  EnergyRhythmResult,
  HydrationInsightResult,
} from '../../lib/flux-types';
import EnergyOrb, { type EnergyLevel } from '../../components/EnergyOrb';
import SuggestionCard from '../../components/SuggestionCard';
import BucketWidget from '../../components/BucketWidget';
import CollapsibleCard from '../../components/CollapsibleCard';
import InsightCard from '../../components/InsightCard';

const LEVELS: EnergyLevel[] = [1, 2, 3, 4, 5];

// Energy level -> suggested activity type, matched to the Log screen's chips.
const SUGGESTED_ACTIVITY: Record<EnergyLevel, string> = {
  1: 'Stretch',
  2: 'Walk',
  3: 'Bodyweight',
  4: 'Strength',
  5: 'HIIT',
};

interface BodyLogRow {
  date: string;
  weight: number | null;
}

interface CalorieLogRow {
  total_calories: number;
}

function todayLocal(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const db = useDatabaseContext();
  const { settings } = useSettings();
  const reduceMotion = settings.reduce_animations === 'true';
  const bodyMetricsEnabled = settings.body_metrics_enabled === 'true';
  const calorieTrackingEnabled = settings.calorie_tracking === 'true';

  const [loading, setLoading] = useState(true);
  const [bodyLoading, setBodyLoading] = useState(false);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel | null>(null);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const [bucketState, setBucketState] = useState<BucketState | null>(null);
  const [recentBodyLogs, setRecentBodyLogs] = useState<BodyLogRow[]>([]);
  const [todayCalories, setTodayCalories] = useState<number | null>(null);
  const [energyRhythm, setEnergyRhythm] = useState<EnergyRhythmResult | null>(null);
  const [hydrationInsight, setHydrationInsight] = useState<HydrationInsightResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    const today = todayLocal();

    (async () => {
      try {
        const checkIn = await db.getFirstAsync<{ energy_level: number }>(
          'SELECT energy_level FROM check_ins WHERE date = ?',
          [today]
        );
        if (!cancelled && checkIn) {
          setSelectedEnergy(checkIn.energy_level as EnergyLevel);
        }
      } catch (err) {
        console.warn('[flux] failed to load today check-in', err);
      }

      try {
        const bucket = await getBucketState(db);
        if (!cancelled) setBucketState(bucket);
      } catch (err) {
        console.warn('[flux] failed to load bucket state', err);
      }

      try {
        const rhythm = await getPattern<EnergyRhythmResult>(db, 'day_energy_rhythm');
        if (!cancelled) setEnergyRhythm(rhythm.data);
      } catch (err) {
        console.warn('[flux] failed to load energy rhythm pattern', err);
      }

      try {
        const hydration = await getPattern<HydrationInsightResult>(db, 'hydration_insight');
        if (!cancelled) setHydrationInsight(hydration.data);
      } catch (err) {
        console.warn('[flux] failed to load hydration pattern', err);
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [db]);

  // Body/calorie data loads in its own effect so toggling those settings
  // only refreshes the body card — the orbs, bucket, and insights above
  // never skeleton-flash when this re-runs.
  useEffect(() => {
    if (!bodyMetricsEnabled) {
      setRecentBodyLogs([]);
      setTodayCalories(null);
      return;
    }

    let cancelled = false;
    const today = todayLocal();
    setBodyLoading(true);

    (async () => {
      try {
        const bodyLogs = await db.getAllAsync<BodyLogRow>(
          'SELECT date, weight FROM body_logs ORDER BY date DESC LIMIT 2'
        );
        if (!cancelled) setRecentBodyLogs(bodyLogs);
      } catch (err) {
        console.warn('[flux] failed to load body logs', err);
      }

      if (calorieTrackingEnabled) {
        try {
          const calorieRow = await db.getFirstAsync<CalorieLogRow>(
            'SELECT total_calories FROM calorie_logs WHERE date = ?',
            [today]
          );
          if (!cancelled) setTodayCalories(calorieRow?.total_calories ?? null);
        } catch (err) {
          console.warn('[flux] failed to load today calories', err);
        }
      } else if (!cancelled) {
        setTodayCalories(null);
      }

      if (!cancelled) setBodyLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [db, bodyMetricsEnabled, calorieTrackingEnabled]);

  const handleOrbPress = useCallback(
    async (level: EnergyLevel) => {
      setSelectedEnergy(level);
      setSuggestionDismissed(false);
      try {
        await logCheckIn(db, { date: todayLocal(), energyLevel: level, mood: level });
      } catch (err) {
        console.warn('[flux] check-in write did not complete', err);
      }
    },
    [db]
  );

  const handleStart = useCallback(() => {
    if (selectedEnergy === null) return;
    router.push({
      pathname: '/(tabs)/log',
      params: { activityType: SUGGESTED_ACTIVITY[selectedEnergy] },
    });
  }, [router, selectedEnergy]);

  const handleSkip = useCallback(() => {
    setSuggestionDismissed(true);
  }, []);

  const showSuggestion = selectedEnergy !== null && !suggestionDismissed;

  const weightDeltaText = (() => {
    if (recentBodyLogs.length < 2) return null;
    const [latest, previous] = recentBodyLogs;
    if (latest.weight === null || previous.weight === null) return null;
    const delta = Math.abs(latest.weight - previous.weight);
    return `changed ${delta.toFixed(1)}kg`;
  })();

  const latestWeight = recentBodyLogs[0]?.weight ?? null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.greeting}>How are you today?</Text>

      {loading ? (
        <>
          <View style={[styles.skeleton, styles.skeletonOrbRow]} />
          <View style={[styles.skeleton, styles.skeletonCard]} />
        </>
      ) : (
        <>
          <View style={styles.orbRow}>
            {LEVELS.map((level) => (
              <EnergyOrb
                key={level}
                level={level}
                selected={selectedEnergy === level}
                dimmed={selectedEnergy !== null}
                onPress={() => handleOrbPress(level)}
                reduceMotion={reduceMotion}
              />
            ))}
          </View>

          {showSuggestion && selectedEnergy !== null && (
            <Animated.View entering={reduceMotion ? undefined : FadeIn}>
              <SuggestionCard
                energyLevel={selectedEnergy}
                onStart={handleStart}
                onSkip={handleSkip}
              />
            </Animated.View>
          )}

          {selectedEnergy !== null && suggestionDismissed && (
            <Text style={styles.skipText}>
              Rest is training too. Your bucket is waiting.
            </Text>
          )}

          {bucketState && (
            <BucketWidget
              lifetimeDrops={bucketState.lifetimeDrops}
              animateFill
              reduceMotion={reduceMotion}
            />
          )}

          {bodyMetricsEnabled && (
            <CollapsibleCard title="Body">
              {bodyLoading ? (
                <View style={[styles.skeleton, styles.skeletonBodyRow]} />
              ) : (
              <View style={styles.bodyRow}>
                {latestWeight !== null && (
                  <Text style={styles.bodyText}>
                    {latestWeight.toFixed(1)}kg
                    {weightDeltaText ? ` · ${weightDeltaText}` : ''}
                  </Text>
                )}
                {calorieTrackingEnabled && todayCalories !== null && (
                  <Text style={styles.bodyText}>{todayCalories} kcal today</Text>
                )}
                {latestWeight === null && todayCalories === null && (
                  <Text style={styles.bodyTextMuted}>No entries yet.</Text>
                )}
              </View>
              )}
            </CollapsibleCard>
          )}

          {(energyRhythm?.lowestDay || energyRhythm?.highestDay || hydrationInsight?.hasEnoughData) && (
            <View style={styles.insightsSection}>
              {energyRhythm?.highestDay && (
                <InsightCard
                  icon="⚡"
                  title="Energy pattern"
                  body={`Your energy tends to peak on ${energyRhythm.highestDay.day}s.`}
                  sentiment="positive"
                />
              )}
              {hydrationInsight?.hasEnoughData && (
                <InsightCard
                  icon="💧"
                  title="Hydration pattern"
                  body={`Mood runs ${hydrationInsight.difference}pts higher when well hydrated.`}
                  sentiment="neutral"
                />
              )}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.screen,
    gap: spacing.cardGap,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.03 * 26,
    color: colors.textPrimary,
  },
  orbRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skipText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bodyRow: {
    gap: 8,
  },
  bodyText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  bodyTextMuted: {
    fontSize: 14,
    color: colors.textMuted,
  },
  insightsSection: {
    gap: spacing.cardGap,
  },
  skeleton: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radii.large,
  },
  skeletonOrbRow: {
    height: 90,
  },
  skeletonCard: {
    height: 160,
  },
  skeletonBodyRow: {
    height: 40,
    borderRadius: radii.small,
  },
});
