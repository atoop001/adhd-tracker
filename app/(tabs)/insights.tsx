import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, radii, spacing } from '../../constants/colors';
import { useDatabaseContext } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import { getEntitlement, purchaseFull, type EntitlementTier } from '../../lib/flux-purchases';
import { getPattern } from '../../lib/flux-pattern-engine';
import type {
  EnergyRhythmResult,
  TagMoodCorrelationRow,
  BurnoutPrecursorResult,
  HydrationInsightResult,
  Sentiment,
} from '../../lib/flux-types';
import InsightCard from '../../components/InsightCard';
import PatternBarChart from '../../components/PatternBarChart';
import PaywallSheet from '../../components/PaywallSheet';

const MIN_WORKOUTS_FOR_INSIGHTS = 7;

interface InsightCardData {
  key: string;
  icon: string;
  title: string;
  body: string;
  sentiment: Sentiment;
}

interface FullPatternData {
  energyRhythm: EnergyRhythmResult;
  cards: InsightCardData[];
}

function buildEnergyCard(result: EnergyRhythmResult): InsightCardData | null {
  if (!result.highestDay) return null;
  const dip = result.lowestDay && result.lowestDay.day !== result.highestDay.day
    ? ` and dips on ${result.lowestDay.day}s`
    : '';
  return {
    key: 'energy',
    icon: '⚡',
    title: 'Energy pattern',
    body: `Your energy tends to peak on ${result.highestDay.day}s${dip}.`,
    sentiment: 'positive',
  };
}

function buildTagCards(rows: TagMoodCorrelationRow[]): InsightCardData[] {
  return rows.map((row) => ({
    key: `tag-${row.label}`,
    icon: row.sentiment === 'negative' ? '⚠️' : row.sentiment === 'positive' ? '🏷️' : '📎',
    title: row.label,
    body: `Averaged a mood of ${row.avgMood} over ${row.sessions} session${row.sessions === 1 ? '' : 's'}.`,
    sentiment: row.sentiment,
  }));
}

function buildBurnoutCard(result: BurnoutPrecursorResult): InsightCardData | null {
  if (!result.isElevated) return null;
  return {
    key: 'burnout',
    icon: '🔋',
    title: 'Recovery check',
    body: `This week logged ${result.currentWeekCount} tougher sessions, above your usual ${result.fourWeekAverage}. Recovery counts too.`,
    sentiment: 'negative',
  };
}

function buildHydrationCard(result: HydrationInsightResult): InsightCardData | null {
  if (!result.hasEnoughData) return null;
  return {
    key: 'hydration',
    icon: '💧',
    title: 'Hydration pattern',
    body: `Mood runs ${result.difference}pts higher on well-hydrated days (${result.hydratedAvgMood} vs ${result.dehydratedAvgMood}).`,
    sentiment: 'neutral',
  };
}

/** Sequentially checks each pattern in priority order and stops at the
 *  first one with renderable content — used for the free-tier preview so
 *  we never compute all four patterns just to show one card. */
async function findFirstAvailableCard(
  db: ReturnType<typeof useDatabaseContext>
): Promise<InsightCardData | null> {
  const energy = await getPattern<EnergyRhythmResult>(db, 'day_energy_rhythm');
  const energyCard = buildEnergyCard(energy.data);
  if (energyCard) return energyCard;

  const tagMood = await getPattern<TagMoodCorrelationRow[]>(db, 'tag_mood_correlation');
  const tagCards = buildTagCards(tagMood.data);
  if (tagCards.length > 0) return tagCards[0];

  const burnout = await getPattern<BurnoutPrecursorResult>(db, 'burnout_precursor');
  const burnoutCard = buildBurnoutCard(burnout.data);
  if (burnoutCard) return burnoutCard;

  const hydration = await getPattern<HydrationInsightResult>(db, 'hydration_insight');
  return buildHydrationCard(hydration.data);
}

async function loadFullPatterns(
  db: ReturnType<typeof useDatabaseContext>
): Promise<FullPatternData> {
  const [energyRhythm, tagMood, burnout, hydration] = await Promise.all([
    getPattern<EnergyRhythmResult>(db, 'day_energy_rhythm'),
    getPattern<TagMoodCorrelationRow[]>(db, 'tag_mood_correlation'),
    getPattern<BurnoutPrecursorResult>(db, 'burnout_precursor'),
    getPattern<HydrationInsightResult>(db, 'hydration_insight'),
  ]);

  const cards: InsightCardData[] = [
    ...buildTagCards(tagMood.data),
    buildBurnoutCard(burnout.data),
    buildHydrationCard(hydration.data),
  ].filter((c): c is InsightCardData => c !== null);

  return { energyRhythm: energyRhythm.data, cards };
}

export default function InsightsScreen() {
  const db = useDatabaseContext();
  const { settings } = useSettings();
  const reduceMotion = settings.reduce_animations === 'true';

  const [loading, setLoading] = useState(true);
  const [entitlement, setEntitlement] = useState<EntitlementTier>('full');
  const [workoutCount, setWorkoutCount] = useState<number | null>(null);
  const [previewCard, setPreviewCard] = useState<InsightCardData | null>(null);
  const [fullData, setFullData] = useState<FullPatternData | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);

  // Shared fetch for entitlement/workout-count/pattern data. Used by the
  // initial mount effect (which toggles the skeleton) and by the
  // focus-refetch effect (silent) so the workout count, entitlement tier
  // and patterns don't go stale after new workouts are logged or a dev
  // toggle flips entitlement while this tab stays mounted in the background.
  const fetchInsightsData = useCallback(
    async (cancelledRef: { current: boolean }) => {
      let tier: EntitlementTier = 'full';
      let count = 0;

      try {
        tier = await getEntitlement(db);
      } catch (err) {
        console.warn('[flux] failed to load entitlement', err);
      }
      if (cancelledRef.current) return;
      setEntitlement(tier);

      try {
        const row = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) AS count FROM workouts WHERE date >= date('now', '-30 days')`
        );
        count = row?.count ?? 0;
      } catch (err) {
        console.warn('[flux] failed to load workout count', err);
      }
      if (cancelledRef.current) return;
      setWorkoutCount(count);

      if (count >= MIN_WORKOUTS_FOR_INSIGHTS) {
        if (tier === 'free') {
          try {
            const card = await findFirstAvailableCard(db);
            if (!cancelledRef.current) setPreviewCard(card);
          } catch (err) {
            console.warn('[flux] failed to load preview pattern', err);
          }
        } else {
          try {
            const data = await loadFullPatterns(db);
            if (!cancelledRef.current) setFullData(data);
          } catch (err) {
            console.warn('[flux] failed to load patterns', err);
          }
        }
      }
    },
    [db]
  );

  useEffect(() => {
    const cancelledRef = { current: false };
    setLoading(true);

    (async () => {
      await fetchInsightsData(cancelledRef);
      if (!cancelledRef.current) setLoading(false);
    })();

    return () => {
      cancelledRef.current = true;
    };
  }, [db, fetchInsightsData]);

  // Silent refetch on refocus — no loading/skeleton flip.
  useFocusEffect(
    useCallback(() => {
      const cancelledRef = { current: false };
      fetchInsightsData(cancelledRef);
      return () => {
        cancelledRef.current = true;
      };
    }, [fetchInsightsData])
  );

  const handleUnlock = useCallback(async () => {
    try {
      const tier = await purchaseFull(db);
      setEntitlement(tier);
      if (workoutCount !== null && workoutCount >= MIN_WORKOUTS_FOR_INSIGHTS) {
        const data = await loadFullPatterns(db);
        setFullData(data);
      }
    } catch (err) {
      console.warn('[flux] purchase did not complete', err);
    } finally {
      setPaywallVisible(false);
    }
  }, [db, workoutCount]);

  const showEmptyState = !loading && workoutCount !== null && workoutCount < MIN_WORKOUTS_FOR_INSIGHTS;
  const showFull = !loading && !showEmptyState && entitlement === 'full';
  const showPreview = !loading && !showEmptyState && entitlement === 'free';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>Insights</Text>

      {loading && (
        <>
          <View style={[styles.skeleton, styles.skeletonChart]} />
          <View style={[styles.skeleton, styles.skeletonCard]} />
          <View style={[styles.skeleton, styles.skeletonCard]} />
        </>
      )}

      {showEmptyState && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📈</Text>
          <Text style={styles.emptyTitle}>Patterns are still forming</Text>
          <Text style={styles.emptyBody}>
            Log a few more sessions and your patterns will start to appear. 7 sessions in
            30 days unlocks insights.
          </Text>
        </View>
      )}

      {showPreview && (
        <Animated.View entering={reduceMotion ? undefined : FadeIn}>
          {previewCard && (
            <InsightCard
              icon={previewCard.icon}
              title={previewCard.title}
              body={previewCard.body}
              sentiment={previewCard.sentiment}
            />
          )}
          <Pressable
            style={styles.teaser}
            onPress={() => setPaywallVisible(true)}
            hitSlop={8}
          >
            <Text style={styles.teaserIcon}>🔒</Text>
            <View style={styles.teaserTextContainer}>
              <Text style={styles.teaserTitle}>More patterns are waiting</Text>
              <Text style={styles.teaserBody}>
                Unlock your full insights to see everything Flux has found.
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      )}

      {showFull && fullData && (
        <Animated.View entering={reduceMotion ? undefined : FadeIn} style={styles.fullContainer}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Energy rhythm</Text>
            <PatternBarChart data={fullData.energyRhythm.byDay} />
          </View>

          {fullData.cards.map((card) => (
            <InsightCard
              key={card.key}
              icon={card.icon}
              title={card.title}
              body={card.body}
              sentiment={card.sentiment}
            />
          ))}

          {fullData.cards.length === 0 && (
            <Text style={styles.noExtraText}>
              No standout patterns yet beyond your energy rhythm — check back as you log
              more.
            </Text>
          )}
        </Animated.View>
      )}

      <PaywallSheet
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onUnlock={handleUnlock}
      />
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
  heading: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.03 * 26,
    color: colors.textPrimary,
  },
  skeleton: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radii.large,
  },
  skeletonChart: {
    height: 160,
  },
  skeletonCard: {
    height: 80,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.large,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  teaser: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    marginTop: spacing.cardGap,
  },
  teaserIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  teaserTextContainer: {
    flex: 1,
  },
  teaserTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  teaserBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  fullContainer: {
    gap: spacing.cardGap,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.large,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  noExtraText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
